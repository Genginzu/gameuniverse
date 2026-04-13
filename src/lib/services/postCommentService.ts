import type { PostCommentsResponse, PostComment } from "@/types/post-comment";

/**
 * Service client pour gérer les opérations de commentaires sur les posts.
 * Communique avec les endpoints /api/posts/:postId/comments/*.
 */
export class PostCommentService {
  /**
   * Récupère les commentaires d'un post.
   */
  static async fetchComments(postId: string): Promise<PostCommentsResponse> {
    const response = await fetch(`/api/posts/${postId}/comments`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch comments");
    }
    return response.json();
  }

  /**
   * Crée un commentaire sur un post.
   */
  static async createComment(postId: string, content: string): Promise<PostComment> {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to create comment");
    }
    return response.json();
  }

  /**
   * Supprime un commentaire d'un post.
   */
  static async deleteComment(postId: string, commentId: string): Promise<void> {
    const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to delete comment");
    }
  }
}
