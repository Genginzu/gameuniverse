/** Visibility of a group */
export type GroupVisibility = "public" | "private";

/** Role of a member within a group */
export type GroupMemberRole = "owner" | "moderator" | "member";

/** Group summary for listing pages */
export interface GroupSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  visibility: GroupVisibility;
  gameId: string | null;
  genreId: string | null;
  gameName: string | null;
  genreName: string | null;
  membersCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/** Full detail of a group, including the viewer's membership */
export interface GroupDetail extends GroupSummary {
  owner: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
  };
  viewerRole: GroupMemberRole | null;
}

/** A member of a group */
export interface GroupMember {
  id: string;
  groupId: string;
  playerId: string;
  role: GroupMemberRole;
  joinedAt: string;
  player: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

/** A post published within a group feed */
export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

/** Payload to create a group */
export interface CreateGroupInput {
  name: string;
  description?: string;
  imageUrl?: string;
  visibility?: GroupVisibility;
  gameId?: string;
  genreId?: string;
}

/** Payload to update a group */
export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  visibility?: GroupVisibility;
  gameId?: string | null;
  genreId?: string | null;
}

/** Payload to create a group post */
export interface CreateGroupPostInput {
  content: string;
}

/** Payload to update a member's role */
export interface UpdateGroupMemberInput {
  role: GroupMemberRole;
}

/** Query params for the group listing/search */
export interface GroupSearchParams {
  search?: string;
  gameId?: string;
  genreId?: string;
  page?: number;
}

/** Paginated response for group listing */
export interface GroupListResponse {
  groups: GroupSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
  };
}

/** Status of a group invitation */
export type GroupInvitationStatus = "pending" | "accepted" | "declined";

/** A group invitation, as seen by the group's owner/admin */
export interface GroupInvitation {
  id: string;
  groupId: string;
  invitedBy: string;
  invitedEmail: string | null;
  invitedPlayerId: string | null;
  invitedPlayer: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
  } | null;
  status: GroupInvitationStatus;
  token: string;
  createdAt: string;
  expiresAt: string;
}

/** A group invitation as seen by the invited player (with group context) */
export interface GroupInvitationWithGroup {
  id: string;
  status: GroupInvitationStatus;
  token: string;
  createdAt: string;
  expiresAt: string;
  group: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    membersCount: number;
  };
  invitedBy: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

/** Payload to create a group invitation — either an email or a username, not both */
export interface CreateGroupInvitationInput {
  email?: string;
  username?: string;
}
