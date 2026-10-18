// Types for community moderation in the admin panel

/** Community as displayed in the admin moderation list */
export interface AdminCommunity {
  id: string;
  name: string;
  slug: string;
  visibility: "public" | "private";
  membersCount: number;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
}

/** Query params for the admin communities list */
export interface FetchAdminCommunitiesParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
