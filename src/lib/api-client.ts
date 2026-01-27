import { createAppError, ErrorType, withRetry, RetryConfig } from "./error-handling";

// Configuration par défaut pour les appels API
const DEFAULT_API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  timeout: 10000,
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorType.NETWORK, ErrorType.SERVER],
  } as RetryConfig,
};

// Interface pour les options d'appel API
export interface ApiCallOptions extends RequestInit {
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
  skipErrorHandling?: boolean;
}

// Type for API response data
type ApiResponseData = Record<string, unknown> | string;

// Type for error with type property
interface TypedError extends Error {
  type?: ErrorType;
}

// Classe pour gérer les appels API avec gestion d'erreurs intégrée
export class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetryConfig: RetryConfig;

  constructor(config = DEFAULT_API_CONFIG) {
    this.baseURL = config.baseURL;
    this.defaultTimeout = config.timeout;
    this.defaultRetryConfig = config.retryConfig;
  }

  // Méthode privée pour effectuer l'appel fetch avec timeout
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw createAppError("La requête a expiré. Veuillez réessayer.", ErrorType.NETWORK, {
          retryable: true,
          cause: error,
        });
      }

      throw error;
    }
  }

  // Méthode privée pour traiter la réponse
  private async processResponse(response: Response): Promise<ApiResponseData> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    let data: ApiResponseData;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (error) {
      throw createAppError(
        "Erreur lors du traitement de la réponse du serveur.",
        ErrorType.SERVER,
        {
          statusCode: response.status,
          cause: error instanceof Error ? error : new Error(String(error)),
        }
      );
    }

    if (!response.ok) {
      const errorData = typeof data === "object" ? data : {};
      const errorMessage = (errorData as Record<string, unknown>)?.error as string || 
                          (errorData as Record<string, unknown>)?.message as string || 
                          `Erreur HTTP ${response.status}`;

      let errorType: ErrorType;
      switch (response.status) {
        case 400:
          errorType = ErrorType.VALIDATION;
          break;
        case 401:
          errorType = ErrorType.AUTHENTICATION;
          break;
        case 403:
          errorType = ErrorType.AUTHORIZATION;
          break;
        case 404:
          errorType = ErrorType.NOT_FOUND;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = ErrorType.SERVER;
          break;
        default:
          errorType = ErrorType.UNKNOWN;
      }

      throw createAppError(errorMessage, errorType, {
        statusCode: response.status,
        details: data,
        retryable: errorType === ErrorType.SERVER,
      });
    }

    return data;
  }

  // Méthode principale pour effectuer des appels API
  async call<T = ApiResponseData>(endpoint: string, options: ApiCallOptions = {}): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retryConfig = {},
      skipErrorHandling = false,
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith("http") ? endpoint : `${this.baseURL}${endpoint}`;

    const finalRetryConfig = { ...this.defaultRetryConfig, ...retryConfig };

    const operation = async (): Promise<T> => {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions, timeout);
        return await this.processResponse(response) as T;
      } catch (error) {
        if (skipErrorHandling) {
          throw error;
        }

        // Si c'est déjà une AppError, la relancer
        const typedError = error as TypedError;
        if (typedError && typedError.type) {
          throw error;
        }

        // Classifier l'erreur
        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw createAppError(
            "Impossible de se connecter au serveur. Vérifiez votre connexion internet.",
            ErrorType.NETWORK,
            { retryable: true, cause: error }
          );
        }

        throw createAppError(
          error instanceof Error ? error.message : "Erreur inconnue",
          ErrorType.UNKNOWN,
          { cause: error instanceof Error ? error : new Error(String(error)) }
        );
      }
    };

    return withRetry(operation, finalRetryConfig);
  }

  // Méthodes de convenance pour les différents verbes HTTP
  async get<T = ApiResponseData>(endpoint: string, options: Omit<ApiCallOptions, "method"> = {}): Promise<T> {
    return this.call<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T = ApiResponseData>(
    endpoint: string,
    data?: unknown,
    options: Omit<ApiCallOptions, "method" | "body"> = {}
  ): Promise<T> {
    return this.call<T>(endpoint, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = ApiResponseData>(
    endpoint: string,
    data?: unknown,
    options: Omit<ApiCallOptions, "method" | "body"> = {}
  ): Promise<T> {
    return this.call<T>(endpoint, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = ApiResponseData>(
    endpoint: string,
    data?: unknown,
    options: Omit<ApiCallOptions, "method" | "body"> = {}
  ): Promise<T> {
    return this.call<T>(endpoint, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = ApiResponseData>(
    endpoint: string,
    options: Omit<ApiCallOptions, "method"> = {}
  ): Promise<T> {
    return this.call<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Instance par défaut du client API
export const apiClient = new ApiClient();

// Hook React pour utiliser le client API avec gestion d'erreurs
export function useApiClient() {
  return apiClient;
}
