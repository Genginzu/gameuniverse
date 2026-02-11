// Types pour la pagination

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Pagination avec limit obligatoire (utilisé par les hooks admin) */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
