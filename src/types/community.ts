/** Visibility of a community */
export type CommunityVisibility = "public" | "private";

/** Role of a member within a community */
export type CommunityMemberRole = "owner" | "moderator" | "member";

/** Community summary for listing pages */
export interface CommunitySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  visibility: CommunityVisibility;
  gameId: string | null;
  genreId: string | null;
  gameName: string | null;
  genreName: string | null;
  membersCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/** Full detail of a community, including the viewer's membership */
export interface CommunityDetail extends CommunitySummary {
  owner: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
  };
  viewerRole: CommunityMemberRole | null;
}

/** A member of a community */
export interface CommunityMember {
  id: string;
  communityId: string;
  playerId: string;
  role: CommunityMemberRole;
  joinedAt: string;
  player: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

/** A post published within a community feed */
export interface CommunityPost {
  id: string;
  communityId: string;
  /** null once the author deleted their account: shown as "Deleted user". */
  authorId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

/** Payload to create a community */
export interface CreateCommunityInput {
  name: string;
  description?: string;
  imageUrl?: string;
  visibility?: CommunityVisibility;
  gameId?: string;
  genreId?: string;
}

/** Payload to update a community */
export interface UpdateCommunityInput {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  visibility?: CommunityVisibility;
  gameId?: string | null;
  genreId?: string | null;
}

/** Payload to create a community post */
export interface CreateCommunityPostInput {
  content: string;
}

/** Payload to update a member's role */
export interface UpdateCommunityMemberInput {
  role: CommunityMemberRole;
}

/** Query params for the community listing/search */
export interface CommunitySearchParams {
  search?: string;
  gameId?: string;
  genreId?: string;
  page?: number;
}

/** Paginated response for community listing */
export interface CommunityListResponse {
  communities: CommunitySummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
  };
}
