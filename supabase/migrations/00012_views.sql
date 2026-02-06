-- ============================================================================
-- Remote Munshi CRM — Migration 00012: Views for KPIs & Reports
-- ============================================================================

-- ============================================================================
-- LEAD KPIs
-- ============================================================================
CREATE OR REPLACE VIEW v_lead_kpis AS
SELECT
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL) AS total_leads,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.created_at >= date_trunc('month', now())) AS leads_this_month,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.converted_client_id IS NOT NULL) AS converted_leads,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.converted_client_id IS NULL) AS open_leads,
  CASE
    WHEN COUNT(*) FILTER (WHERE l.deleted_at IS NULL) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.converted_client_id IS NOT NULL)::NUMERIC /
      COUNT(*) FILTER (WHERE l.deleted_at IS NULL)::NUMERIC * 100, 1
    )
    ELSE 0
  END AS conversion_rate
FROM leads l;

-- ============================================================================
-- CLIENT KPIs
-- ============================================================================
CREATE OR REPLACE VIEW v_client_kpis AS
SELECT
  COUNT(*) FILTER (WHERE c.deleted_at IS NULL) AS total_clients,
  COUNT(*) FILTER (WHERE c.deleted_at IS NULL AND c.status = 'active') AS active_clients,
  COUNT(*) FILTER (WHERE c.deleted_at IS NULL AND c.status = 'inactive') AS inactive_clients,
  COUNT(*) FILTER (WHERE c.deleted_at IS NULL AND c.created_at >= date_trunc('month', now())) AS new_this_month
FROM clients c;

-- ============================================================================
-- TASK SUMMARY (grouped by assignee with status pivot)
-- ============================================================================
CREATE OR REPLACE VIEW v_task_summary AS
SELECT
  e.id AS employee_id,
  e.name AS employee_name,
  COUNT(*) FILTER (WHERE t.status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE t.status = 'in_progress') AS in_progress,
  COUNT(*) FILTER (WHERE t.status = 'in_review') AS in_review,
  COUNT(*) FILTER (WHERE t.status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE t.status = 'on_hold') AS on_hold,
  COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled')) AS overdue,
  COUNT(*) AS total
FROM employees e
LEFT JOIN task_assignees ta ON ta.employee_id = e.id
LEFT JOIN tasks t ON t.id = ta.task_id AND t.deleted_at IS NULL
WHERE e.deleted_at IS NULL AND e.status = 'active'
GROUP BY e.id, e.name;

-- ============================================================================
-- DSC KPIs
-- ============================================================================
CREATE OR REPLACE VIEW v_dsc_kpis AS
SELECT
  COUNT(*) FILTER (WHERE d.deleted_at IS NULL) AS total_dscs,
  COUNT(*) FILTER (WHERE d.deleted_at IS NULL AND d.status = 'active') AS active_dscs,
  COUNT(*) FILTER (WHERE d.deleted_at IS NULL AND d.status = 'expired') AS expired_dscs,
  COUNT(*) FILTER (WHERE d.deleted_at IS NULL AND d.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS expiring_soon
FROM dscs d;

-- ============================================================================
-- LICENSE KPIs
-- ============================================================================
CREATE OR REPLACE VIEW v_license_kpis AS
SELECT
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL) AS total_licenses,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.expiry_date > CURRENT_DATE) AS active_licenses,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.expiry_date <= CURRENT_DATE) AS expired_licenses,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS expiring_soon
FROM licenses l;

-- ============================================================================
-- COMPLIANCE KPIs
-- ============================================================================
CREATE OR REPLACE VIEW v_compliance_kpis AS
SELECT
  COUNT(*) FILTER (WHERE ce.deleted_at IS NULL) AS total_entries,
  COUNT(*) FILTER (WHERE ce.deleted_at IS NULL AND ce.status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE ce.deleted_at IS NULL AND ce.status = 'filed') AS filed,
  COUNT(*) FILTER (WHERE ce.deleted_at IS NULL AND ce.due_date < CURRENT_DATE AND ce.status NOT IN ('filed', 'not_applicable')) AS overdue,
  COUNT(*) FILTER (WHERE ce.deleted_at IS NULL AND ce.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND ce.status NOT IN ('filed', 'not_applicable')) AS due_this_week
FROM compliance_entries ce;

-- ============================================================================
-- SALES SUMMARY
-- ============================================================================
CREATE OR REPLACE VIEW v_sales_summary AS
SELECT
  COUNT(*) FILTER (WHERE i.deleted_at IS NULL AND i.type = 'invoice') AS total_invoices,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.deleted_at IS NULL AND i.type = 'invoice'), 0) AS total_invoiced,
  COALESCE(SUM(i.amount_paid) FILTER (WHERE i.deleted_at IS NULL AND i.type = 'invoice'), 0) AS total_received,
  COALESCE(SUM(i.balance_due) FILTER (WHERE i.deleted_at IS NULL AND i.type = 'invoice' AND i.status NOT IN ('cancelled')), 0) AS total_receivable,
  COUNT(*) FILTER (WHERE i.deleted_at IS NULL AND i.type = 'invoice' AND i.status = 'overdue') AS overdue_invoices,
  COUNT(*) FILTER (WHERE i.deleted_at IS NULL AND i.type = 'proforma') AS total_proformas,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.deleted_at IS NULL AND i.type = 'proforma' AND i.status NOT IN ('cancelled')), 0) AS proforma_value
FROM invoices i;

-- ============================================================================
-- TIMESHEET REPORT
-- ============================================================================
CREATE OR REPLACE VIEW v_timesheet_report AS
SELECT
  te.employee_id,
  e.name AS employee_name,
  te.date,
  SUM(te.hours) AS total_hours,
  SUM(te.hours) FILTER (WHERE te.billable) AS billable_hours,
  SUM(te.hours) FILTER (WHERE NOT te.billable) AS non_billable_hours,
  COUNT(DISTINCT te.client_id) AS clients_worked
FROM time_entries te
JOIN employees e ON e.id = te.employee_id
GROUP BY te.employee_id, e.name, te.date;

-- ============================================================================
-- REVENUE BY USER
-- ============================================================================
CREATE OR REPLACE VIEW v_revenue_by_user AS
SELECT
  e.id AS employee_id,
  e.name AS employee_name,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.type = 'invoice' AND i.deleted_at IS NULL), 0) AS total_invoiced,
  COALESCE(SUM(i.amount_paid) FILTER (WHERE i.type = 'invoice' AND i.deleted_at IS NULL), 0) AS total_collected,
  COUNT(DISTINCT i.client_id) FILTER (WHERE i.type = 'invoice' AND i.deleted_at IS NULL) AS unique_clients
FROM employees e
LEFT JOIN client_assignees ca ON ca.employee_id = e.id AND ca.is_primary = true
LEFT JOIN invoices i ON i.client_id = ca.client_id
WHERE e.deleted_at IS NULL
GROUP BY e.id, e.name;
