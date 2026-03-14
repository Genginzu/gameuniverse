export interface PostMention {
  playerId: string;
  username: string;
}

export interface Post {
  id: string;
  playerId: string;
  content: string;
  imageUrl: string | null;
  tags: string[];
  mentions: PostMention[];
  createdAt: string;
  updatedAt: string;
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
  };
}

export interface CreatePostPayload {
  content: string;
  imageUrl?: string;
}
