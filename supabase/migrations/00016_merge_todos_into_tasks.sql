-- ============================================================================
-- Remote Munshi CRM — Migration 00016: Merge Todos into Tasks + Sub-task Index
-- ============================================================================

-- 1. Migrate existing todos into tasks table
INSERT INTO tasks (id, task_name, description, priority, due_date, status, completed_at, created_by, deleted_at, created_at, updated_at)
SELECT
  t.id,
  t.title,
  t.description,
  t.priority,
  t.due_date,
  CASE WHEN t.is_completed THEN 'completed'::task_status ELSE 'pending'::task_status END,
  t.completed_at,
  t.employee_id,
  t.deleted_at,
  t.created_at,
  t.updated_at
FROM todos t;

-- 2. Create task_assignees entries for migrated todos (assign to the owning employee)
INSERT INTO task_assignees (task_id, employee_id)
SELECT t.id, t.employee_id
FROM todos t
WHERE t.deleted_at IS NULL;

-- 3. Add index on parent_task_id for efficient sub-task queries
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE deleted_at IS NULL;

-- 4. Update v_task_summary to exclude sub-tasks from counts
CREATE OR REPLACE VIEW v_task_summary AS
SELECT
  e.id AS employee_id,
  e.name AS employee_name,
  COUNT(*) FILTER (WHERE t.status = 'pending' AND t.parent_task_id IS NULL) AS pending,
  COUNT(*) FILTER (WHERE t.status = 'in_progress' AND t.parent_task_id IS NULL) AS in_progress,
  COUNT(*) FILTER (WHERE t.status = 'in_review' AND t.parent_task_id IS NULL) AS in_review,
  COUNT(*) FILTER (WHERE t.status = 'completed' AND t.parent_task_id IS NULL) AS completed,
  COUNT(*) FILTER (WHERE t.status = 'on_hold' AND t.parent_task_id IS NULL) AS on_hold,
  COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled') AND t.parent_task_id IS NULL) AS overdue,
  COUNT(*) FILTER (WHERE t.parent_task_id IS NULL) AS total
FROM employees e
LEFT JOIN task_assignees ta ON ta.employee_id = e.id
LEFT JOIN tasks t ON t.id = ta.task_id AND t.deleted_at IS NULL
WHERE e.deleted_at IS NULL AND e.status = 'active'
GROUP BY e.id, e.name;

-- 5. Drop the todos table
DROP TABLE IF EXISTS todos;
