-- Content reporting system: users flag inappropriate content, admins moderate.
-- Covers reviews, posts, comments and profiles. See issue #172.

CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('review', 'post', 'comment', 'profile')),
  content_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  action_taken text
    CHECK (action_taken IN ('none', 'content_deleted', 'author_warned', 'author_suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.content_reports IS 'User reports of inappropriate content for admin moderation';
COMMENT ON COLUMN public.content_reports.content_type IS 'Type of reported content: review, post, comment or profile';
COMMENT ON COLUMN public.content_reports.content_id IS 'Identifier of the reported content row';
COMMENT ON COLUMN public.content_reports.action_taken IS 'Moderation action applied when resolving the report';

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON public.content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON public.content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_created
  ON public.content_reports(reporter_id, created_at DESC);

-- Prevent the same user from reporting the same content more than once.
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_reports_reporter_content
  ON public.content_reports(reporter_id, content_type, content_id);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Policies are dropped first so the migration can be re-applied safely.
-- Reporters can view their own reports.
DROP POLICY IF EXISTS "Users can view their own reports" ON public.content_reports;
CREATE POLICY "Users can view their own reports"
  ON public.content_reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Authenticated users can create reports authored by themselves.
DROP POLICY IF EXISTS "Users can create reports" ON public.content_reports;
CREATE POLICY "Users can create reports"
  ON public.content_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Service role has full access (admin moderation runs via the service-role client).
DROP POLICY IF EXISTS "Service role full access content_reports" ON public.content_reports;
CREATE POLICY "Service role full access content_reports"
  ON public.content_reports FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Author suspension flag used by the "suspend author" moderation action.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

COMMENT ON COLUMN public.profiles.is_suspended IS 'Whether the account is suspended by an admin';

-- Allow the "warn author" moderation action to emit a notification.
-- Keeps every type added before (incl. 20260919000001_add_enriched_notification_types).
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'post_comment',
    'discussion_message',
    'post_created',
    'post_mention',
    'coaching_requested',
    'coaching_confirmed',
    'coaching_declined',
    'coaching_started',
    'coaching_completed',
    'coaching_cancelled',
    'coaching_paid',
    'friend_request',
    'friend_accepted',
    'review_vote',
    'achievement_unlocked',
    'moderation_warning'
  ));
