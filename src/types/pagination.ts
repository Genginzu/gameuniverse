// Types pour la pagination

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
