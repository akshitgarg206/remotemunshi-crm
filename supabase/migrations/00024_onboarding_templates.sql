-- 00024: Client Onboarding Templates
-- Extends recurring_tasks to support onboarding triggers (auto-create tasks on client creation)

-- Enum for template trigger type
CREATE TYPE template_trigger_type AS ENUM ('recurring', 'onboarding');

-- Add trigger_type column (defaults to 'recurring' so existing templates are unaffected)
ALTER TABLE recurring_tasks
  ADD COLUMN trigger_type template_trigger_type NOT NULL DEFAULT 'recurring';

-- Onboarding templates don't need a frequency — make it optional
ALTER TABLE recurring_tasks
  ALTER COLUMN frequency DROP NOT NULL;

-- Partial index for fast lookup of active onboarding templates
CREATE INDEX idx_recurring_tasks_onboarding
  ON recurring_tasks(trigger_type, service_id)
  WHERE deleted_at IS NULL AND is_active = true AND trigger_type = 'onboarding';
