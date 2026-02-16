export interface Comment {
  id: string;
  userId: string;
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
