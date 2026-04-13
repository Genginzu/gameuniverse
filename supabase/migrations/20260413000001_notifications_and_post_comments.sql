-- Migration: Create post_comments and notifications tables
-- Objective: Add the post commenting system and the notification system for
-- Gamers Universe. post_comments stores comments on player posts, notifications
-- stores alerts for post comments and discussion messages.

-- =============================================================================
-- 1. Table: post_comments
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.player_posts(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.post_comments IS 'Commentaires des joueurs sur les posts';
COMMENT ON COLUMN public.post_comments.id IS 'Identifiant unique du commentaire (UUID)';
COMMENT ON COLUMN public.post_comments.post_id IS 'Référence au post commenté';
COMMENT ON COLUMN public.post_comments.player_id IS 'Référence au joueur auteur du commentaire';
COMMENT ON COLUMN public.post_comments.content IS 'Contenu du commentaire (1-500 caractères)';
COMMENT ON COLUMN public.post_comments.created_at IS 'Date de création';
COMMENT ON COLUMN public.post_comments.updated_at IS 'Date de dernière modification';

-- Index pour récupérer les commentaires d'un post
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- =============================================================================
-- 2. Table: notifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('post_comment', 'discussion_message')),
  reference_id    UUID NOT NULL,
  content_preview TEXT NOT NULL DEFAULT '',
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'Notifications des joueurs';
COMMENT ON COLUMN public.notifications.id IS 'Identifiant unique de la notification (UUID)';
COMMENT ON COLUMN public.notifications.recipient_id IS 'Joueur destinataire de la notification';
COMMENT ON COLUMN public.notifications.sender_id IS 'Joueur émetteur de la notification';
COMMENT ON COLUMN public.notifications.type IS 'Type de notification (post_comment, discussion_message)';
COMMENT ON COLUMN public.notifications.reference_id IS 'ID de la ressource liée (post_id ou conversation_id)';
COMMENT ON COLUMN public.notifications.content_preview IS 'Aperçu du contenu (max 100 caractères)';
COMMENT ON COLUMN public.notifications.is_read IS 'Statut de lecture (false = non lue)';
COMMENT ON COLUMN public.notifications.created_at IS 'Date de création';

-- Index composite pour les requêtes de notifications non lues
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications(recipient_id, is_read) WHERE is_read = false;

-- =============================================================================
-- 3. Row Level Security — post_comments
-- =============================================================================

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "post_comments_select" ON public.post_comments
  FOR SELECT TO authenticated USING (true);

-- Insertion : uniquement l'auteur du commentaire
CREATE POLICY "post_comments_insert" ON public.post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

-- Suppression : auteur du commentaire OU propriétaire du post
CREATE POLICY "post_comments_delete" ON public.post_comments
  FOR DELETE TO authenticated USING (
    auth.uid() = player_id
    OR auth.uid() = (SELECT pp.player_id FROM public.player_posts pp WHERE pp.id = post_id)
  );

-- =============================================================================
-- 4. Row Level Security — notifications
-- =============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement ses propres notifications
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = recipient_id);

-- Mise à jour : uniquement ses propres notifications
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);

-- Insertion : le sender peut insérer ses propres notifications
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
