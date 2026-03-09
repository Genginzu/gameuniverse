-- Migration: Fix friendship UPDATE RLS policy
-- Objective: Add explicit WITH CHECK clause to the UPDATE policy so that
-- changing status from 'pending' to 'accepted' or 'declined' is allowed.
-- Without WITH CHECK, PostgreSQL defaults it to the USING expression which
-- requires status = 'pending' — making the updated row fail the check.

-- Drop the existing policy
DROP POLICY IF EXISTS "Receiver can update pending requests" ON public.friendships;

-- Recreate with explicit WITH CHECK
CREATE POLICY "Receiver can update pending requests"
  ON public.friendships FOR UPDATE
  USING (receiver_id = auth.uid() AND status = 'pending')
  WITH CHECK (receiver_id = auth.uid() AND status IN ('accepted', 'declined'));
