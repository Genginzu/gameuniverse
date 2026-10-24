/**
 * An activity event: a player action the platform rewards with achievements
 * (and their XP) and GU Coins. See GLOSSARY.md, "Activity rewards".
 */
export type ActivityEvent =
  | { kind: "library_game_added"; userId: string; gameId: string }
  | { kind: "review_created"; userId: string; reviewId: string }
  | { kind: "friendship_accepted"; accepterId: string; requesterId: string }
  | { kind: "collection_created"; userId: string }
  | { kind: "collection_item_added"; userId: string; gameId: string }
  | { kind: "post_created"; userId: string; postId: string }
  | { kind: "post_comment_created"; userId: string; commentId: string }
  | { kind: "character_comment_created"; userId: string; commentId: string }
  | { kind: "character_favorited"; userId: string; characterId: string }
  | { kind: "discussion_message_sent"; userId: string; messageId: string }
  | { kind: "playtime_logged"; userId: string };

export type ActivityEventKind = ActivityEvent["kind"];
