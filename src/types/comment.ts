export interface Comment {
  id: string;
  /** null once the author deleted their account: shown as "Deleted user". */
  userId: string | null;
  characterId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  playerAvatar: string | null;
}

export interface CommentFormData {
  content: string;
}

export interface CommentsResponse {
  comments: Comment[];
  totalCount: number;
  userHasCommented: boolean;
  userComment?: Comment;
}
