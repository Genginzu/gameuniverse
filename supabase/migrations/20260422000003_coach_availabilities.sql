-- Migration: Create coach_availabilities table
-- Stores coach availability slots (recurring or specific date)

CREATE TABLE IF NOT EXISTS coach_availabilities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Paris',
  is_recurring boolean DEFAULT true,
  specific_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CHECK (start_time < end_time)
);

COMMENT ON TABLE coach_availabilities IS 'Coach availability slots for booking sessions, supports recurring weekly slots and specific date overrides';

CREATE INDEX IF NOT EXISTS idx_coach_availabilities_coach_id ON coach_availabilities(coach_id);

ALTER TABLE coach_availabilities ENABLE ROW LEVEL SECURITY;

-- Everyone can view availabilities
CREATE POLICY "coach_availabilities_select" ON coach_availabilities
  FOR SELECT USING (true);

-- Coach owner can insert their own availabilities
CREATE POLICY "coach_availabilities_insert" ON coach_availabilities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles WHERE id = coach_id AND player_id = auth.uid()
    )
  );

-- Coach owner can update their own availabilities
CREATE POLICY "coach_availabilities_update" ON coach_availabilities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM coach_profiles WHERE id = coach_id AND player_id = auth.uid()
    )
  );

-- Coach owner can delete their own availabilities
CREATE POLICY "coach_availabilities_delete" ON coach_availabilities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM coach_profiles WHERE id = coach_id AND player_id = auth.uid()
    )
  );
