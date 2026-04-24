-- Add Stripe Connect fields to coach_profiles for payment integration

ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.coach_profiles.stripe_account_id IS 'Stripe Connect Express account ID';
COMMENT ON COLUMN public.coach_profiles.stripe_onboarding_complete IS 'Whether the coach has completed Stripe onboarding';

CREATE INDEX IF NOT EXISTS idx_coach_profiles_stripe_account_id
  ON public.coach_profiles (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
