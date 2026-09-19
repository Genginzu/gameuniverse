import type {
  CommunityDetail,
  CommunityListResponse,
  CommunityMember,
  CommunityPost,
  CommunitySearchParams,
  CreateCommunityInput,
  CreateCommunityPostInput,
  UpdateCommunityInput,
  UpdateCommunityMemberInput,
} from "@/types/community";

/** Build the query string for GET /api/communities from search params. */
export function buildCommunitiesUrl(params: CommunitySearchParams): string {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.gameId) searchParams.set("gameId", params.gameId);
  if (params.genreId) searchParams.set("genreId", params.genreId);
  if (params.page !== undefined) searchParams.set("page", String(params.page));

  const query = searchParams.toString();
  return `/api/communities${query ? `?${query}` : ""}`;
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
 * Client service for communities. Communicates with /api/communities routes.
 * Used by SWR hooks (useCommunities, useCommunity, useCommunityMembers, useCommunityPosts).
 */
export class CommunityService {
  static async fetchCommunities(
    params: CommunitySearchParams = {}
  ): Promise<CommunityListResponse> {
    const response = await fetch(buildCommunitiesUrl(params));
    return handleResponse<CommunityListResponse>(response);
  }

  static async fetchCommunity(slug: string): Promise<CommunityDetail> {
    const response = await fetch(`/api/communities/${slug}`);
    return handleResponse<{ community: CommunityDetail }>(response).then((r) => r.community);
  }

  static async createCommunity(input: CreateCommunityInput): Promise<CommunityDetail> {
    const response = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<{ community: CommunityDetail }>(response).then((r) => r.community);
  }

  static async updateCommunity(slug: string, input: UpdateCommunityInput): Promise<void> {
    const response = await fetch(`/api/communities/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<void>(response);
  }

  static async deleteCommunity(slug: string): Promise<void> {
    const response = await fetch(`/api/communities/${slug}`, { method: "DELETE" });
    return handleResponse<void>(response);
  }

  static async joinCommunity(slug: string): Promise<void> {
    const response = await fetch(`/api/communities/${slug}/join`, { method: "POST" });
    return handleResponse<void>(response);
  }

  static async leaveCommunity(slug: string): Promise<void> {
    const response = await fetch(`/api/communities/${slug}/join`, { method: "DELETE" });
    return handleResponse<void>(response);
  }

  static async fetchMembers(slug: string): Promise<CommunityMember[]> {
    const response = await fetch(`/api/communities/${slug}/members`);
    return handleResponse<{ members: CommunityMember[] }>(response).then((r) => r.members);
  }

  static async updateMember(
    slug: string,
    playerId: string,
    input: UpdateCommunityMemberInput
  ): Promise<void> {
    const response = await fetch(`/api/communities/${slug}/members/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<void>(response);
  }

  static async removeMember(slug: string, playerId: string): Promise<void> {
    const response = await fetch(`/api/communities/${slug}/members/${playerId}`, {
      method: "DELETE",
    });
    return handleResponse<void>(response);
  }

  static async fetchPosts(slug: string): Promise<CommunityPost[]> {
    const response = await fetch(`/api/communities/${slug}/posts`);
    return handleResponse<{ posts: CommunityPost[] }>(response).then((r) => r.posts);
  }

  static async createPost(slug: string, input: CreateCommunityPostInput): Promise<CommunityPost> {
    const response = await fetch(`/api/communities/${slug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<{ post: CommunityPost }>(response).then((r) => r.post);
  }
}
