-- Phase 6: Multi-school support and gamification preferences

CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  primary_color text DEFAULT '#e8222a',
  logo_url text,
  gamification_enabled boolean DEFAULT true,
  leaderboard_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instructor_schools (
  instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (instructor_id, school_id)
);

CREATE TABLE IF NOT EXISTS student_schools (
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (student_id, school_id)
);

-- Optional: persist gamification server-side (client uses localStorage in demo)
CREATE TABLE IF NOT EXISTS student_gamification (
  student_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  xp integer DEFAULT 0,
  streak_count integer DEFAULT 0,
  streak_last_date date,
  badges jsonb DEFAULT '[]'::jsonb,
  leaderboard_opt_in boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE instructor_students
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

-- RLS (sketch — tighten per deployment)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY schools_read ON schools FOR SELECT TO authenticated USING (true);

CREATE POLICY instructor_schools_own ON instructor_schools
  FOR ALL TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY student_schools_read ON student_schools
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM instructor_schools ins
      JOIN instructor_students ist ON ist.instructor_id = ins.instructor_id
      WHERE ins.school_id = student_schools.school_id
        AND ist.student_id = student_schools.student_id
        AND ins.instructor_id = auth.uid()
    )
  );

CREATE POLICY gamification_own ON student_gamification
  FOR ALL TO authenticated
  USING (student_id = auth.uid());
