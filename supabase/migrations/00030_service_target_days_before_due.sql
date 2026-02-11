-- ============================================================================
-- Remote Munshi CRM — Migration 00030: Service Target Days Before Due
-- ============================================================================

-- When generating tasks from service deadlines, target_date = due_date - this value
ALTER TABLE services ADD COLUMN target_days_before_due INTEGER;
