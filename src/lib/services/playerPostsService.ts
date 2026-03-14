import type { CreatePostPayload, Post, PostsResponse } from "@/types/post";

/**
 * Service client pour les posts d'un joueur.
 * Communique avec les routes /api/players/{playerId}/posts.
 */
export class PlayerPostsService {
  /** Récupère les posts paginés d'un joueur, avec recherche optionnelle. */
  static async fetchPosts(
    playerId: string,
    page?: number,
    search?: string
  ): Promise<PostsResponse> {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (search) params.set("search", search);

    const query = params.toString();
    const url = `/api/players/${playerId}/posts${query ? `?${query}` : ""}`;

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.error || `Failed to fetch posts (${response.status})`;
      throw new Error(message);
    }

    return response.json();
  }

  /** Crée un nouveau post pour un joueur, avec image optionnelle. */
  static async createPost(playerId: string, content: string, imageUrl?: string): Promise<Post> {
    const payload: CreatePostPayload = { content };
    if (imageUrl) payload.imageUrl = imageUrl;

    const response = await fetch(`/api/players/${playerId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.error || `Failed to create post (${response.status})`;
      throw new Error(message);
    }

    return response.json();
  }

  /** Supprime un post d'un joueur. */
  static async deletePost(playerId: string, postId: string): Promise<void> {
    const response = await fetch(`/api/players/${playerId}/posts/${postId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.error || `Failed to delete post (${response.status})`;
      throw new Error(message);
    }
  }
}
