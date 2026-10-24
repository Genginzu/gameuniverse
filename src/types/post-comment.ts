export interface PostComment {
  id: string;
  postId: string;
  /** null once the author deleted their account: shown as "Deleted user". */
  playerId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  player?: {
    username: string;
    avatarUrl: string | null;
  };
}
