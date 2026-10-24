import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

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
  details?: unknown;
  retryable?: boolean;
}

// Configuration pour le retry automatique
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
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
    details?: unknown;
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
export function classifyError(error: unknown): AppError {
  if (error && typeof error === "object" && "type" in error) {
    return error as AppError;
  }

  const err = error as Record<string, unknown>;

  if (
    err?.name === "TypeError" &&
    typeof err?.message === "string" &&
    err.message.includes("fetch")
  ) {
    return createAppError(
      "Erreur de connexion réseau. Vérifiez votre connexion internet.",
      ErrorType.NETWORK,
      { cause: error as Error, retryable: true }
    );
  }

  if (err?.status || err?.statusCode) {
    const statusCode = (err.status || err.statusCode) as number;

    if (statusCode === 401) {
      return createAppError(
        "Session expirée. Veuillez vous reconnecter.",
        ErrorType.AUTHENTICATION,
        { statusCode, cause: error as Error }
      );
    }

    if (statusCode === 403) {
      return createAppError("Accès non autorisé à cette ressource.", ErrorType.AUTHORIZATION, {
        statusCode,
        cause: error as Error,
      });
    }

    if (statusCode === 404) {
      return createAppError("Ressource non trouvée.", ErrorType.NOT_FOUND, {
        statusCode,
        cause: error as Error,
      });
    }

    if (statusCode >= 400 && statusCode < 500) {
      return createAppError("Erreur de validation des données.", ErrorType.VALIDATION, {
        statusCode,
        cause: error as Error,
      });
    }

    if (statusCode >= 500) {
      return createAppError("Erreur serveur temporaire. Veuillez réessayer.", ErrorType.SERVER, {
        statusCode,
        cause: error as Error,
        retryable: true,
      });
    }
  }

  const message =
    err?.message && typeof err.message === "string"
      ? err.message
      : "Une erreur inattendue s'est produite.";
  return createAppError(message, ErrorType.UNKNOWN, { cause: error as Error });
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

      if (!lastError.retryable || attempt === finalConfig.maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );

      logger.warn(
        `Retry attempt ${attempt}/${finalConfig.maxAttempts} failed: ${lastError.message}`
      );
      logger.warn(`Retrying in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Hook pour gérer les erreurs dans les composants React
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    const appError = classifyError(error);

    toast({
      variant: "destructive",
      title: "Erreur",
      description: appError.message,
    });

    // Log error with context
    reportError(appError, context);
  };

  return { handleError };
}

/**
 * Report an error to the console with optional context.
 */
export function reportError(error: AppError | Error, context?: string) {
  const appError = "type" in error ? (error as AppError) : classifyError(error);

  logger.error(`[${appError.type}]${context ? ` (${context})` : ""} ${appError.message}`, {
    statusCode: appError.statusCode,
    details: appError.details,
    retryable: appError.retryable,
  });
}
