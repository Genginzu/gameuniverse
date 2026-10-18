import type {
  CreateGroupInput,
  CreateGroupInvitationInput,
  CreateGroupPostInput,
  GroupDetail,
  GroupInvitation,
  GroupListResponse,
  GroupMember,
  GroupPost,
  GroupSearchParams,
  UpdateGroupInput,
  UpdateGroupMemberInput,
} from "@/types/group";

/** Build the query string for GET /api/groups from search params. */
export function buildGroupsUrl(params: GroupSearchParams): string {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.gameId) searchParams.set("gameId", params.gameId);
  if (params.genreId) searchParams.set("genreId", params.genreId);
  if (params.page !== undefined) searchParams.set("page", String(params.page));

  const query = searchParams.toString();
  return `/api/groups${query ? `?${query}` : ""}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

/**
 * Client service for groups. Communicates with /api/groups routes.
 * Used by SWR hooks (useGroups, useGroup, useGroupMembers, useGroupPosts).
 */
export class GroupService {
  static async fetchGroups(params: GroupSearchParams = {}): Promise<GroupListResponse> {
    const response = await fetch(buildGroupsUrl(params));
    return handleResponse<GroupListResponse>(response);
  }

  static async fetchGroup(slug: string): Promise<GroupDetail> {
    const response = await fetch(`/api/groups/${slug}`);
    return handleResponse<{ group: GroupDetail }>(response).then((r) => r.group);
  }

  static async createGroup(input: CreateGroupInput): Promise<GroupDetail> {
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<{ group: GroupDetail }>(response).then((r) => r.group);
  }

  static async updateGroup(slug: string, input: UpdateGroupInput): Promise<void> {
    const response = await fetch(`/api/groups/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<void>(response);
  }

  static async deleteGroup(slug: string): Promise<void> {
    const response = await fetch(`/api/groups/${slug}`, { method: "DELETE" });
    return handleResponse<void>(response);
  }

  static async leaveGroup(slug: string): Promise<void> {
    const response = await fetch(`/api/groups/${slug}/join`, { method: "DELETE" });
    return handleResponse<void>(response);
  }

  static async fetchMembers(slug: string): Promise<GroupMember[]> {
    const response = await fetch(`/api/groups/${slug}/members`);
    return handleResponse<{ members: GroupMember[] }>(response).then((r) => r.members);
  }

  static async updateMember(
    slug: string,
    playerId: string,
    input: UpdateGroupMemberInput
  ): Promise<void> {
    const response = await fetch(`/api/groups/${slug}/members/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<void>(response);
  }

  static async removeMember(slug: string, playerId: string): Promise<void> {
    const response = await fetch(`/api/groups/${slug}/members/${playerId}`, {
      method: "DELETE",
    });
    return handleResponse<void>(response);
  }

  static async fetchPosts(slug: string): Promise<GroupPost[]> {
    const response = await fetch(`/api/groups/${slug}/posts`);
    return handleResponse<{ posts: GroupPost[] }>(response).then((r) => r.posts);
  }

  static async createPost(slug: string, input: CreateGroupPostInput): Promise<GroupPost> {
    const response = await fetch(`/api/groups/${slug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<{ post: GroupPost }>(response).then((r) => r.post);
  }

  static async fetchInvitations(slug: string): Promise<GroupInvitation[]> {
    const response = await fetch(`/api/groups/${slug}/invitations`);
    return handleResponse<{ invitations: GroupInvitation[] }>(response).then(
      (r) => r.invitations
    );
  }

  static async createInvitation(
    slug: string,
    input: CreateGroupInvitationInput
  ): Promise<GroupInvitation> {
    const response = await fetch(`/api/groups/${slug}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<{ invitation: GroupInvitation }>(response).then((r) => r.invitation);
  }
}
