-- ============================================================================
-- Remote Munshi CRM — Migration 00004: Task Module (6 tables)
-- ============================================================================

-- ============================================================================
-- SPRINTS
-- ============================================================================
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status sprint_status NOT NULL DEFAULT 'planning',
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- RECURRING TASKS
-- ============================================================================
CREATE TABLE recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  service_id UUID REFERENCES services(id),
  priority task_priority NOT NULL DEFAULT 'medium',
  frequency recurrence_frequency NOT NULL,
  day_of_month INTEGER,
  day_of_week INTEGER,
  month_of_year INTEGER,
  estimated_hours NUMERIC(6,2),
  checklist_template JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  next_generation_date DATE,
  last_generated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TASKS
-- ============================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT UNIQUE,
  task_name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  service_id UUID REFERENCES services(id),
  status task_status NOT NULL DEFAULT 'pending',
  sub_status_id UUID REFERENCES task_sub_statuses(id),
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  start_date DATE,
  completed_at TIMESTAMPTZ,
  estimated_hours NUMERIC(6,2),
  sprint_id UUID REFERENCES sprints(id),
  recurring_task_id UUID REFERENCES recurring_tasks(id),
  parent_task_id UUID REFERENCES tasks(id),
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_client ON tasks(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_service ON tasks(service_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_priority ON tasks(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_recurring ON tasks(recurring_task_id) WHERE deleted_at IS NULL;

-- Task Assignees (junction)
CREATE TABLE task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, employee_id)
);

-- Recurring Task Assignees (junction)
CREATE TABLE recurring_task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_task_id UUID NOT NULL REFERENCES recurring_tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE(recurring_task_id, employee_id)
);

-- ============================================================================
-- TASK CHECKLIST ITEMS
-- ============================================================================
CREATE TABLE task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  checked_by UUID REFERENCES employees(id),
  checked_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_task ON task_checklist_items(task_id);

-- ============================================================================
-- TASK COMMENTS
-- ============================================================================
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  comment TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_task ON task_comments(task_id);

-- ============================================================================
-- TIME ENTRIES
-- ============================================================================
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  task_id UUID REFERENCES tasks(id),
  client_id UUID REFERENCES clients(id),
  service_id UUID REFERENCES services(id),
  date DATE NOT NULL,
  hours NUMERIC(5,2) NOT NULL,
  description TEXT,
  billable BOOLEAN NOT NULL DEFAULT true,
  billed BOOLEAN NOT NULL DEFAULT false,
  invoice_id UUID,  -- FK added in invoice migration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_client ON time_entries(client_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);

-- ============================================================================
-- Updated_at triggers
-- ============================================================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON recurring_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
