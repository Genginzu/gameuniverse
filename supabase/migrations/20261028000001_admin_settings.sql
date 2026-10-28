-- Migration: admin_settings key/value store.
--
-- Holds runtime settings changed from the admin without a redeploy. First key:
-- translation_model, the Vercel AI Gateway model id used by the admin
-- translations page (e.g. "openai/gpt-5.4-nano").
--
-- Server-only: read and written by API routes with the service role. RLS is
-- enabled without policies and no client grant is given.

CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_settings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_settings TO service_role;

COMMENT ON TABLE public.admin_settings IS
  'Runtime admin settings (key/value). Server-only: service role access, no client grant.';
COMMENT ON COLUMN public.admin_settings.key IS 'Setting identifier, e.g. translation_model.';
COMMENT ON COLUMN public.admin_settings.value IS 'Setting value as JSON (a string for translation_model).';
COMMENT ON COLUMN public.admin_settings.updated_by IS 'Admin who last changed the setting.';
