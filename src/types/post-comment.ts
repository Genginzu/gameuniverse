export interface PostComment {
  id: string;
  postId: string;
  playerId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  player?: {
    username: string;
    avatarUrl: string | null;
  };
}

export interface PostCommentsResponse {
  comments: PostComment[];
  totalCount: number;
}
