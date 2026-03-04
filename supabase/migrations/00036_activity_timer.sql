-- Remote Munshi CRM — Migration 00036: Activity Timer
-- 15-minute productivity timer with category tracking

-- Enum for activity categories
CREATE TYPE activity_category AS ENUM ('operations', 'experiment', 'marketing', 'automation');

-- Activity blocks table
CREATE TABLE activity_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  block_start TIMESTAMPTZ NOT NULL,
  block_end TIMESTAMPTZ NOT NULL,
  category activity_category NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_missed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_activity_blocks_employee
  ON activity_blocks (employee_id);

CREATE INDEX idx_activity_blocks_employee_start
  ON activity_blocks (employee_id, block_start DESC);

CREATE INDEX idx_activity_blocks_category
  ON activity_blocks (category);

-- Updated_at trigger
CREATE TRIGGER set_activity_blocks_updated_at
  BEFORE UPDATE ON activity_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE activity_blocks ENABLE ROW LEVEL SECURITY;

-- All authenticated can read (for team visibility / admin dashboards)
CREATE POLICY "Authenticated users can read activity blocks"
  ON activity_blocks FOR SELECT TO authenticated USING (true);

-- Insert/update/delete scoped to own employee_id
CREATE POLICY "Users can insert own activity blocks"
  ON activity_blocks FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = (SELECT id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can update own activity blocks"
  ON activity_blocks FOR UPDATE TO authenticated
  USING (
    employee_id = (SELECT id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can delete own activity blocks"
  ON activity_blocks FOR DELETE TO authenticated
  USING (
    employee_id = (SELECT id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- KPI view: daily stats by employee, date (IST), category
CREATE VIEW v_activity_block_daily_stats AS
SELECT
  ab.employee_id,
  (ab.block_start AT TIME ZONE 'Asia/Kolkata')::date AS block_date,
  ab.category,
  COUNT(*) AS block_count,
  SUM(EXTRACT(EPOCH FROM (ab.block_end - ab.block_start)) / 60) AS total_minutes,
  COUNT(*) FILTER (WHERE ab.is_missed) AS missed_count
FROM activity_blocks ab
GROUP BY ab.employee_id, (ab.block_start AT TIME ZONE 'Asia/Kolkata')::date, ab.category;

-- Function: get top activity suggestions by frequency
CREATE OR REPLACE FUNCTION get_activity_suggestions(
  p_employee_id UUID,
  p_category activity_category DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (description TEXT, usage_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT ab.description, COUNT(*) AS usage_count
  FROM activity_blocks ab
  WHERE ab.employee_id = p_employee_id
    AND ab.description != ''
    AND (p_category IS NULL OR ab.category = p_category)
  GROUP BY ab.description
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
