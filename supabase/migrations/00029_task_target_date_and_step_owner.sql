-- ============================================================================
-- Remote Munshi CRM — Migration 00029: Task Target Date + Step Owner Type
-- ============================================================================

-- Add target_date to tasks (internal completion goal, before statutory due_date)
ALTER TABLE tasks ADD COLUMN target_date DATE;

-- Add owner_type to task_checklist_items (who is responsible: team or client)
ALTER TABLE task_checklist_items ADD COLUMN owner_type TEXT NOT NULL DEFAULT 'team' CHECK (owner_type IN ('team', 'client'));

-- Add target_days_before_due to recurring_tasks (templates) so generated tasks compute target_date
ALTER TABLE recurring_tasks ADD COLUMN target_days_before_due INTEGER;
