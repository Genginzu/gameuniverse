// Types for group moderation in the admin panel

/** Group as displayed in the admin moderation list */
export interface AdminGroup {
  id: string;
  name: string;
  slug: string;
  visibility: "public" | "private";
  membersCount: number;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
}

/** Query params for the admin groups list */
export interface FetchAdminGroupsParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
