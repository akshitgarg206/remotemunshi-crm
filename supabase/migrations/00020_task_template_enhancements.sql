-- Migration: Task Template Enhancements
-- Adds reviewer defaults and edit-level control to recurring_tasks (used as task templates)

ALTER TABLE recurring_tasks
  ADD COLUMN reviewer_1_id UUID REFERENCES employees(id),
  ADD COLUMN reviewer_2_id UUID REFERENCES employees(id),
  ADD COLUMN min_edit_level INTEGER NOT NULL DEFAULT 5;

-- Indexes for reviewer lookups
CREATE INDEX idx_recurring_tasks_reviewer_1 ON recurring_tasks(reviewer_1_id)
  WHERE deleted_at IS NULL AND reviewer_1_id IS NOT NULL;
CREATE INDEX idx_recurring_tasks_reviewer_2 ON recurring_tasks(reviewer_2_id)
  WHERE deleted_at IS NULL AND reviewer_2_id IS NOT NULL;

-- Index for service-based template lookup (used by deadline auto-task creation)
CREATE INDEX idx_recurring_tasks_service_active ON recurring_tasks(service_id)
  WHERE deleted_at IS NULL AND is_active = true;

COMMENT ON COLUMN recurring_tasks.min_edit_level IS 'Minimum role permission_level to edit this template (default 5 = Assistant Manager+)';
COMMENT ON COLUMN recurring_tasks.reviewer_1_id IS 'Default Level 1 reviewer for tasks generated from this template';
COMMENT ON COLUMN recurring_tasks.reviewer_2_id IS 'Default Level 2 reviewer for tasks generated from this template';
