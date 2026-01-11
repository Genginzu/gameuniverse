import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

// Types d'erreurs
export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  statusCode?: number;
  details?: any;
  retryable?: boolean;
}

// Configuration pour le retry automatique
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // en millisecondes
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorType.NETWORK, ErrorType.SERVER],
};

// Créer une erreur typée
export function createAppError(
  message: string,
  type: ErrorType,
  options?: {
    code?: string;
    statusCode?: number;
    details?: any;
    retryable?: boolean;
    cause?: Error;
  }
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.code = options?.code;
  error.statusCode = options?.statusCode;
  error.details = options?.details;
  error.retryable = options?.retryable ?? DEFAULT_RETRY_CONFIG.retryableErrors.includes(type);

  if (options?.cause) {
    error.cause = options.cause;
  }

  return error;
}

// Classifier une erreur selon son type
export function classifyError(error: any): AppError {
  // Si c'est déjà une AppError, la retourner telle quelle
  if (error.type) {
    return error as AppError;
  }

  // Erreurs réseau (fetch, axios, etc.)
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return createAppError(
      "Erreur de connexion réseau. Vérifiez votre connexion internet.",
      ErrorType.NETWORK,
      { cause: error, retryable: true }
    );
  }

  // Erreurs HTTP
  if (error.status || error.statusCode) {
    const statusCode = error.status || error.statusCode;

    if (statusCode === 401) {
      return createAppError(
        "Session expirée. Veuillez vous reconnecter.",
        ErrorType.AUTHENTICATION,
        { statusCode, cause: error }
      );
    }

    if (statusCode === 403) {
      return createAppError("Accès non autorisé à cette ressource.", ErrorType.AUTHORIZATION, {
        statusCode,
        cause: error,
      });
    }

    if (statusCode === 404) {
      return createAppError("Ressource non trouvée.", ErrorType.NOT_FOUND, {
        statusCode,
        cause: error,
      });
    }

    if (statusCode >= 400 && statusCode < 500) {
      return createAppError("Erreur de validation des données.", ErrorType.VALIDATION, {
        statusCode,
        cause: error,
      });
    }

    if (statusCode >= 500) {
      return createAppError("Erreur serveur temporaire. Veuillez réessayer.", ErrorType.SERVER, {
        statusCode,
        cause: error,
        retryable: true,
      });
    }
  }

  // Erreur inconnue
  return createAppError(
    error.message || "Une erreur inattendue s'est produite.",
    ErrorType.UNKNOWN,
    { cause: error }
  );
}

// Fonction de retry avec exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AppError;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = classifyError(error);

      // Si l'erreur n'est pas retryable ou si c'est la dernière tentative
      if (!lastError.retryable || attempt === finalConfig.maxAttempts) {
        throw lastError;
      }

      // Calculer le délai avec exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );

      console.warn(`Tentative ${attempt}/${finalConfig.maxAttempts} échouée:`, lastError.message);
      console.warn(`Nouvelle tentative dans ${delay}ms...`);

      // Attendre avant la prochaine tentative
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Wrapper pour les appels API avec gestion d'erreur automatique
export async function apiCall<T>(
  operation: () => Promise<T>,
  options?: {
    showErrorToast?: boolean;
    retryConfig?: Partial<RetryConfig>;
    errorMessage?: string;
  }
): Promise<T> {
  const { showErrorToast = true, retryConfig = {}, errorMessage } = options || {};

  try {
    return await withRetry(operation, retryConfig);
  } catch (error) {
    const appError = classifyError(error);

    // Afficher un toast d'erreur si demandé
    if (showErrorToast) {
      const toastConfig: any = {
        variant: "destructive",
        title: "Erreur",
        description: errorMessage || appError.message,
      };

      if (appError.retryable) {
        toastConfig.action = {
          altText: "Réessayer",
          onClick: () => apiCall(operation, options),
          children: "Réessayer",
        };
      }

      toast(toastConfig);
    }

    throw appError;
  }
}

// Hook pour gérer les erreurs dans les composants React
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    const appError = classifyError(error);

    console.error(`Error in ${context || "component"}:`, appError);

    // Afficher un toast d'erreur
    toast({
      variant: "destructive",
      title: "Erreur",
      description: appError.message,
    });

    // Dans une vraie application, on pourrait envoyer l'erreur à un service de monitoring
    // reportError(appError, context);
  };

  return { handleError };
}

// Fonction pour reporter les erreurs à un service de monitoring (placeholder)
export function reportError(error: AppError, context?: string) {
  // Ici on pourrait intégrer avec Sentry, LogRocket, etc.
  console.error("Reporting error:", {
    message: error.message,
    type: error.type,
    code: error.code,
    statusCode: error.statusCode,
    context,
    stack: error.stack,
    details: error.details,
  });
}

// Utilitaires pour les messages d'erreur localisés
export const ERROR_MESSAGES = {
  fr: {
    [ErrorType.NETWORK]: "Erreur de connexion réseau. Vérifiez votre connexion internet.",
    [ErrorType.VALIDATION]: "Les données saisies ne sont pas valides.",
    [ErrorType.AUTHENTICATION]: "Session expirée. Veuillez vous reconnecter.",
    [ErrorType.AUTHORIZATION]: "Vous n'avez pas les permissions nécessaires.",
    [ErrorType.NOT_FOUND]: "La ressource demandée n'a pas été trouvée.",
    [ErrorType.SERVER]: "Erreur serveur temporaire. Veuillez réessayer.",
    [ErrorType.UNKNOWN]: "Une erreur inattendue s'est produite.",
  },
  en: {
    [ErrorType.NETWORK]: "Network connection error. Please check your internet connection.",
    [ErrorType.VALIDATION]: "The entered data is not valid.",
    [ErrorType.AUTHENTICATION]: "Session expired. Please log in again.",
    [ErrorType.AUTHORIZATION]: "You don't have the necessary permissions.",
    [ErrorType.NOT_FOUND]: "The requested resource was not found.",
    [ErrorType.SERVER]: "Temporary server error. Please try again.",
    [ErrorType.UNKNOWN]: "An unexpected error occurred.",
  },
};

export function getErrorMessage(type: ErrorType, locale: string = "fr"): string {
  return ERROR_MESSAGES[locale as keyof typeof ERROR_MESSAGES]?.[type] || ERROR_MESSAGES.fr[type];
}
