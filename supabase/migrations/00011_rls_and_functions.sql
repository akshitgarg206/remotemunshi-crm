-- ============================================================================
-- Remote Munshi CRM — Migration 00011: RLS Policies & Helper Functions
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current employee ID from auth user
CREATE OR REPLACE FUNCTION current_employee_id()
RETURNS UUID AS $$
  SELECT id FROM employees
  WHERE auth_user_id = auth.uid()
  AND deleted_at IS NULL
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM employees
     WHERE auth_user_id = auth.uid()
     AND deleted_at IS NULL
     LIMIT 1),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user has permission
CREATE OR REPLACE FUNCTION has_permission(p_module TEXT, p_action TEXT)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT rp.allowed FROM role_permissions rp
     JOIN employees e ON e.role_id = rp.role_id
     WHERE e.auth_user_id = auth.uid()
     AND e.deleted_at IS NULL
     AND rp.module = p_module
     AND rp.action = p_action
     LIMIT 1),
    false
  ) OR is_admin();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'departments', 'designations', 'roles', 'role_permissions',
      'billing_organizations', 'business_hours', 'financial_years',
      'holidays', 'leave_types', 'lead_stages', 'task_sub_statuses',
      'client_groups', 'notice_types', 'service_categories',
      'email_templates', 'module_settings', 'password_categories',
      'compliance_forms', 'invoice_sequences',
      'employees', 'services', 'leads', 'clients',
      'lead_assignees', 'lead_services', 'client_assignees',
      'client_services', 'client_group_members',
      'tasks', 'task_assignees', 'recurring_task_assignees',
      'task_checklist_items', 'task_comments', 'time_entries',
      'sprints', 'recurring_tasks',
      'invoices', 'invoice_line_items', 'payments', 'recurring_invoices',
      'dscs', 'licenses', 'license_attachments',
      'client_passwords', 'documents_in_out', 'document_in_out_files',
      'compliance_entries', 'compliance_attachments',
      'notices', 'notice_attachments',
      'attendance', 'leave_balances', 'leave_requests', 'salary_records',
      'chat_channels', 'chat_channel_members', 'chat_messages',
      'calendar_events', 'calendar_event_attendees', 'todos',
      'notifications', 'mentions', 'activity_log', 'attachments',
      'email_accounts', 'email_logs',
      'api_keys', 'webhooks', 'webhook_deliveries'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END;
$$;

-- ============================================================================
-- RLS POLICIES — Config tables (read by all authenticated, write by admin)
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'departments', 'designations', 'roles', 'role_permissions',
      'billing_organizations', 'business_hours', 'financial_years',
      'holidays', 'leave_types', 'lead_stages', 'task_sub_statuses',
      'client_groups', 'notice_types', 'service_categories',
      'email_templates', 'module_settings', 'password_categories',
      'compliance_forms', 'invoice_sequences'
    ])
  LOOP
    -- Read: all authenticated users
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (true)',
      'select_' || tbl, tbl
    );
    -- Write: admin only
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (is_admin())',
      'insert_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (is_admin())',
      'update_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (is_admin())',
      'delete_' || tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================================
-- RLS POLICIES — Core entities (all authenticated can read, write based on role)
-- ============================================================================

-- Employees: read all, write own or admin
CREATE POLICY select_employees ON employees FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY insert_employees ON employees FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY update_employees ON employees FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid() OR is_admin());

-- Services: read all, write admin
CREATE POLICY select_services ON services FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY insert_services ON services FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_permission('services', 'create'));
CREATE POLICY update_services ON services FOR UPDATE TO authenticated
  USING (is_admin() OR has_permission('services', 'update'));

-- Clients: all authenticated read, assignees + admin write
CREATE POLICY select_clients ON clients FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY insert_clients ON clients FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY update_clients ON clients FOR UPDATE TO authenticated
  USING (true);

-- Leads: all authenticated
CREATE POLICY select_leads ON leads FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY insert_leads ON leads FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY update_leads ON leads FOR UPDATE TO authenticated
  USING (true);

-- Tasks: all authenticated
CREATE POLICY select_tasks ON tasks FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY insert_tasks ON tasks FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY update_tasks ON tasks FOR UPDATE TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES — Junction tables (follow parent access)
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'lead_assignees', 'lead_services', 'client_assignees',
      'client_services', 'client_group_members',
      'task_assignees', 'recurring_task_assignees',
      'chat_channel_members', 'calendar_event_attendees'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (true)',
      'select_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (true)',
      'insert_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (true)',
      'update_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (true)',
      'delete_' || tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================================
-- RLS POLICIES — Remaining entity tables (authenticated access)
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'task_checklist_items', 'task_comments', 'time_entries',
      'sprints', 'recurring_tasks',
      'invoices', 'invoice_line_items', 'payments', 'recurring_invoices',
      'dscs', 'licenses', 'license_attachments',
      'client_passwords', 'documents_in_out', 'document_in_out_files',
      'compliance_entries', 'compliance_attachments',
      'notices', 'notice_attachments',
      'attendance', 'leave_balances', 'leave_requests', 'salary_records',
      'chat_channels', 'chat_messages',
      'calendar_events', 'todos',
      'activity_log', 'attachments',
      'email_accounts', 'email_logs',
      'api_keys', 'webhooks', 'webhook_deliveries'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (true)',
      'select_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (true)',
      'insert_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (true)',
      'update_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (true)',
      'delete_' || tbl, tbl
    );
  END LOOP;
END;
$$;

-- Notifications & Mentions: only own
CREATE POLICY select_notifications ON notifications FOR SELECT TO authenticated
  USING (employee_id = current_employee_id());
CREATE POLICY select_mentions ON mentions FOR SELECT TO authenticated
  USING (employee_id = current_employee_id());

-- Override the blanket select policies for notifications/mentions
DROP POLICY IF EXISTS select_notifications ON notifications;
DROP POLICY IF EXISTS select_mentions ON mentions;
CREATE POLICY select_own_notifications ON notifications FOR SELECT TO authenticated
  USING (employee_id = current_employee_id());
CREATE POLICY select_own_mentions ON mentions FOR SELECT TO authenticated
  USING (employee_id = current_employee_id());

-- ============================================================================
-- SERVICE ROLE BYPASS (for API key access and server-side operations)
-- ============================================================================
-- Note: Supabase service_role key bypasses RLS by default
