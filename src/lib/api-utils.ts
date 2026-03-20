/**
 * Shared API Route Utilities
 *
 * Provides common utilities for API route handlers including:
 * - Pagination parameter parsing with safe defaults
 * - Array parameter parsing for comma-separated values
 * - Standardized paginated response formatting
 * - Consistent error handling
 */

/**
 * Pagination parameters extracted from URL search params
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata for API responses
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Standardized paginated API response structure
 */
export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  filters?: Record<string, unknown>;
}

/**
 * Standardized API error response structure
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MIN_LIMIT = 1;

/**
 * Parse pagination parameters from URLSearchParams with safe defaults.
 *
 * - Returns page=1 for invalid/missing page values
 * - Returns limit=20 for invalid/missing limit values
 * - Clamps limit between 1 and maxLimit (default 50)
 *
 * @param searchParams - URLSearchParams object from request URL
 * @param defaults - Optional custom default values
 * @returns Validated pagination parameters
 *
 * @example
 * const params = parsePaginationParams(new URL(request.url).searchParams);
 * // { page: 1, limit: 20 } for empty params
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults?: { page?: number; limit?: number; maxLimit?: number }
): PaginationParams {
  const defaultPage = defaults?.page ?? DEFAULT_PAGE;
  const defaultLimit = defaults?.limit ?? DEFAULT_LIMIT;
  const maxLimit = defaults?.maxLimit ?? MAX_LIMIT;

  const pageStr = searchParams.get("page");
  const limitStr = searchParams.get("limit");

  // Parse page with fallback to default
  let page = defaultPage;
  if (pageStr !== null) {
    const parsed = parseInt(pageStr, 10);
    page = !isNaN(parsed) && parsed >= 1 ? parsed : defaultPage;
  }

  // Parse limit with fallback to default and clamping
  let limit = defaultLimit;
  if (limitStr !== null) {
    const parsed = parseInt(limitStr, 10);
    if (!isNaN(parsed)) {
      limit = Math.min(maxLimit, Math.max(MIN_LIMIT, parsed));
    }
  }

  return { page, limit };
}

/**
 * Parse a comma-separated string parameter into an array.
 *
 * - Returns empty array for null/undefined/empty values
 * - Filters out empty strings after splitting
 * - Trims whitespace from each value
 *
 * @param value - Comma-separated string or null
 * @returns Array of non-empty string values
 *
 * @example
 * parseArrayParam("action,rpg,adventure") // ["action", "rpg", "adventure"]
 * parseArrayParam(null) // []
 * parseArrayParam("") // []
 * parseArrayParam("  action , rpg  ") // ["action", "rpg"]
 */
export function parseArrayParam(value: string | null): string[] {
  if (!value || value.trim() === "") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Create a standardized paginated API response.
 *
 * Calculates pagination metadata (totalPages, hasNextPage, hasPreviousPage)
 * from the provided data and pagination info.
 *
 * @param data - Array of items for the current page
 * @param pagination - Pagination parameters and total count
 * @param filters - Optional filter values to include in response
 * @returns Standardized paginated response object
 *
 * @example
 * const response = createPaginatedResponse(
 *   games,
 *   { page: 1, limit: 20, totalCount: 100 },
 *   { search: "zelda", genres: ["rpg"] }
 * );
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationParams & { totalCount: number },
  filters?: Record<string, unknown>
): PaginatedApiResponse<T> {
  const { page, limit, totalCount } = pagination;

  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const response: PaginatedApiResponse<T> = {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage,
      hasPreviousPage,
    },
  };

  if (filters !== undefined) {
    response.filters = filters;
  }

  return response;
}

/**
 * Handle API errors consistently.
 *
 * Extracts error message from various error types and formats
 * a standardized error response. In development mode, includes
 * additional details for debugging.
 *
 * @param error - The caught error (Error, string, or unknown)
 * @param defaultMessage - Fallback message if error cannot be parsed
 * @returns Standardized error response object
 *
 * @example
 * try {
 *   // ... API logic
 * } catch (error) {
 *   const errorResponse = handleApiError(error, "Failed to fetch games");
 *   return NextResponse.json(errorResponse, { status: 500 });
 * }
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = "Internal server error"
): ApiErrorResponse {
  const isDev = process.env.NODE_ENV === "development";

  // Extract error message
  let message = defaultMessage;
  let code: string | undefined;
  let details: unknown;

  if (error instanceof Error) {
    message = error.message || defaultMessage;
    code = error.name !== "Error" ? error.name : undefined;

    if (isDev) {
      details = {
        stack: error.stack,
        cause: error.cause,
      };
    }
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object") {
    // Handle error-like objects
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.message === "string") {
      message = errorObj.message;
    }
    if (typeof errorObj.code === "string") {
      code = errorObj.code;
    }
  }

  const response: ApiErrorResponse = {
    error: isDev ? message : defaultMessage,
  };

  if (code) {
    response.code = code;
  }

  if (isDev && details) {
    response.details = details;
  }

  return response;
}

/**
 * Validate that required parameters are present.
 *
 * @param params - Object containing parameter values
 * @param required - Array of required parameter names
 * @returns Validation result with missing parameter names
 *
 * @example
 * const validation = validateRequiredParams(
 *   { id: "123", name: undefined },
 *   ["id", "name"]
 * );
 * // { valid: false, missing: ["name"] }
 */
export function validateRequiredParams(
  params: Record<string, unknown>,
  required: string[]
): { valid: boolean; missing: string[] } {
  const missing = required.filter((key) => {
    const value = params[key];
    return value === undefined || value === null || value === "";
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Calculate offset for pagination queries.
 *
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @returns Offset value for database queries
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
