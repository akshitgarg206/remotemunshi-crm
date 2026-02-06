-- Migration: Service Deadlines
-- Adds deadline tracking for recurring services (GST, TDS, ITR, etc.)

-- ============================================================================
-- 1. ALTER TABLE services — add deadline-related columns
-- ============================================================================

ALTER TABLE services
  ADD COLUMN frequency recurrence_frequency,
  ADD COLUMN due_day_of_month INTEGER CHECK (due_day_of_month BETWEEN 1 AND 31),
  ADD COLUMN reminder_days INTEGER[] DEFAULT '{}',
  ADD COLUMN requires_data_collection BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN data_description TEXT,
  ADD COLUMN initial_message_template TEXT,
  ADD COLUMN reminder_message_template TEXT;

-- ============================================================================
-- 2. CREATE TYPE deadline_status
-- ============================================================================

CREATE TYPE deadline_status AS ENUM (
  'upcoming',
  'data_pending',
  'data_received',
  'in_progress',
  'filed',
  'overdue'
);

-- ============================================================================
-- 3. CREATE TABLE service_deadlines
-- ============================================================================

CREATE TABLE service_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  period_label TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status deadline_status NOT NULL DEFAULT 'data_pending',
  data_received BOOLEAN NOT NULL DEFAULT false,
  data_received_at TIMESTAMPTZ,
  data_received_by UUID REFERENCES employees(id),
  task_id UUID REFERENCES tasks(id),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, service_id, period_start)
);

-- ============================================================================
-- 4. CREATE TABLE deadline_reminders
-- ============================================================================

CREATE TABLE deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deadline_id UUID NOT NULL REFERENCES service_deadlines(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  channel communication_channel NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'auto_sent')),
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES employees(id),
  communication_id UUID REFERENCES client_communications(id),
  message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. Indexes
-- ============================================================================

CREATE INDEX idx_service_deadlines_lookup
  ON service_deadlines (client_id, service_id, due_date, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_deadline_reminders_schedule
  ON deadline_reminders (deadline_id, scheduled_date, status);

-- ============================================================================
-- 6. RLS policies
-- ============================================================================

ALTER TABLE service_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_deadlines_select" ON service_deadlines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_deadlines_insert" ON service_deadlines
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "service_deadlines_update" ON service_deadlines
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "service_deadlines_delete" ON service_deadlines
  FOR DELETE TO authenticated USING (true);

ALTER TABLE deadline_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadline_reminders_select" ON deadline_reminders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "deadline_reminders_insert" ON deadline_reminders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "deadline_reminders_update" ON deadline_reminders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "deadline_reminders_delete" ON deadline_reminders
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 7. KPI View
-- ============================================================================

CREATE OR REPLACE VIEW v_deadline_kpis AS
SELECT
  COUNT(*) FILTER (WHERE status = 'data_pending' AND due_date >= CURRENT_DATE) AS data_pending,
  COUNT(*) FILTER (WHERE status = 'data_received') AS data_received,
  COUNT(*) FILTER (WHERE status IN ('in_progress', 'filed')) AS in_progress_or_filed,
  COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('filed', 'data_received', 'in_progress')) AS overdue,
  COUNT(*) FILTER (WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'data_pending') AS due_this_week
FROM service_deadlines
WHERE deleted_at IS NULL;

-- ============================================================================
-- 8. Updated_at trigger on service_deadlines
-- ============================================================================

CREATE TRIGGER set_service_deadlines_updated_at
  BEFORE UPDATE ON service_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
