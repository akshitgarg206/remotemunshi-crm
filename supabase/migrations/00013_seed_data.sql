-- ============================================================================
-- Remote Munshi CRM — Migration 00013: Seed Data
-- ============================================================================

-- ============================================================================
-- ROLES
-- ============================================================================
INSERT INTO roles (name, description, is_system) VALUES
  ('Super Admin', 'Full system access', true),
  ('Admin', 'Administrative access', true),
  ('Manager', 'Team management access', false),
  ('Senior Associate', 'Senior team member', false),
  ('Associate', 'Standard team member', false),
  ('Intern', 'Limited access', false);

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================
INSERT INTO departments (name) VALUES
  ('Accounts'),
  ('Audit'),
  ('Taxation'),
  ('Corporate Law'),
  ('Compliance'),
  ('Payroll'),
  ('Admin');

-- ============================================================================
-- DESIGNATIONS
-- ============================================================================
INSERT INTO designations (name) VALUES
  ('Partner'),
  ('Manager'),
  ('Senior Associate'),
  ('Associate'),
  ('Junior Associate'),
  ('Intern'),
  ('Article Assistant');

-- ============================================================================
-- LEAD STAGES
-- ============================================================================
INSERT INTO lead_stages (name, sort_order, color) VALUES
  ('New', 1, '#3B82F6'),
  ('Contacted', 2, '#8B5CF6'),
  ('Qualified', 3, '#F59E0B'),
  ('Proposal Sent', 4, '#F97316'),
  ('Negotiation', 5, '#EF4444'),
  ('Won', 6, '#10B981'),
  ('Lost', 7, '#6B7280');

-- ============================================================================
-- SERVICE CATEGORIES
-- ============================================================================
INSERT INTO service_categories (name, sort_order) VALUES
  ('GST', 1),
  ('Income Tax', 2),
  ('Audit', 3),
  ('Company Law / MCA', 4),
  ('Registration', 5),
  ('Payroll & Compliance', 6),
  ('Bookkeeping', 7),
  ('Advisory', 8),
  ('TDS', 9),
  ('Other', 10);

-- ============================================================================
-- SERVICES (common CA firm services)
-- ============================================================================
INSERT INTO services (name, sac_code, default_rate, category_id) VALUES
  ('GST Registration', '998231', 2000, (SELECT id FROM service_categories WHERE name = 'GST')),
  ('GST Monthly Return (GSTR-3B)', '998231', 1500, (SELECT id FROM service_categories WHERE name = 'GST')),
  ('GST Monthly Return (GSTR-1)', '998231', 1500, (SELECT id FROM service_categories WHERE name = 'GST')),
  ('GST Quarterly Return (GSTR-1)', '998231', 2000, (SELECT id FROM service_categories WHERE name = 'GST')),
  ('GST Annual Return (GSTR-9)', '998231', 5000, (SELECT id FROM service_categories WHERE name = 'GST')),
  ('GST Audit (GSTR-9C)', '998231', 10000, (SELECT id FROM service_categories WHERE name = 'GST')),
  ('GST Refund', '998231', 5000, (SELECT id FROM service_categories WHERE name = 'GST')),
  ('Income Tax Return (ITR)', '998231', 3000, (SELECT id FROM service_categories WHERE name = 'Income Tax')),
  ('Tax Audit (44AB)', '998231', 15000, (SELECT id FROM service_categories WHERE name = 'Audit')),
  ('Statutory Audit', '998231', 25000, (SELECT id FROM service_categories WHERE name = 'Audit')),
  ('Internal Audit', '998231', 20000, (SELECT id FROM service_categories WHERE name = 'Audit')),
  ('Company Incorporation', '998231', 8000, (SELECT id FROM service_categories WHERE name = 'Company Law / MCA')),
  ('LLP Registration', '998231', 6000, (SELECT id FROM service_categories WHERE name = 'Company Law / MCA')),
  ('Annual Filing (AOC-4 / MGT-7)', '998231', 5000, (SELECT id FROM service_categories WHERE name = 'Company Law / MCA')),
  ('DIR-3 KYC', '998231', 500, (SELECT id FROM service_categories WHERE name = 'Company Law / MCA')),
  ('MSME Registration', '998231', 1000, (SELECT id FROM service_categories WHERE name = 'Registration')),
  ('Import Export Code', '998231', 2000, (SELECT id FROM service_categories WHERE name = 'Registration')),
  ('Trade License', '998231', 3000, (SELECT id FROM service_categories WHERE name = 'Registration')),
  ('Bookkeeping (Monthly)', '998231', 5000, (SELECT id FROM service_categories WHERE name = 'Bookkeeping')),
  ('Payroll Processing', '998231', 3000, (SELECT id FROM service_categories WHERE name = 'Payroll & Compliance')),
  ('PF/ESI Returns', '998231', 1500, (SELECT id FROM service_categories WHERE name = 'Payroll & Compliance')),
  ('TDS Return (24Q/26Q)', '998231', 2000, (SELECT id FROM service_categories WHERE name = 'TDS')),
  ('TDS on Property (26QB)', '998231', 1000, (SELECT id FROM service_categories WHERE name = 'TDS')),
  ('Advisory/Consultation', '998231', 5000, (SELECT id FROM service_categories WHERE name = 'Advisory'));

-- ============================================================================
-- LEAVE TYPES
-- ============================================================================
INSERT INTO leave_types (name, code, default_days_per_year, is_paid, is_carry_forward, max_carry_forward) VALUES
  ('Casual Leave', 'CL', 12, true, false, 0),
  ('Sick Leave', 'SL', 6, true, false, 0),
  ('Earned Leave', 'EL', 15, true, true, 30),
  ('Maternity Leave', 'ML', 182, true, false, 0),
  ('Paternity Leave', 'PL', 15, true, false, 0),
  ('Compensatory Off', 'CO', 0, true, false, 0),
  ('Leave Without Pay', 'LWP', 0, false, false, 0);

-- ============================================================================
-- FINANCIAL YEARS
-- ============================================================================
INSERT INTO financial_years (name, start_date, end_date, is_current) VALUES
  ('FY 2024-25', '2024-04-01', '2025-03-31', false),
  ('FY 2025-26', '2025-04-01', '2026-03-31', true),
  ('FY 2026-27', '2026-04-01', '2027-03-31', false);

-- ============================================================================
-- BUSINESS HOURS (Mon-Sat)
-- ============================================================================
INSERT INTO business_hours (day_of_week, start_time, end_time, is_working_day) VALUES
  (0, '10:00', '19:00', false),  -- Sunday
  (1, '10:00', '19:00', true),   -- Monday
  (2, '10:00', '19:00', true),   -- Tuesday
  (3, '10:00', '19:00', true),   -- Wednesday
  (4, '10:00', '19:00', true),   -- Thursday
  (5, '10:00', '19:00', true),   -- Friday
  (6, '10:00', '14:00', true);   -- Saturday (half day)

-- ============================================================================
-- NOTICE TYPES
-- ============================================================================
INSERT INTO notice_types (name) VALUES
  ('Income Tax Notice'),
  ('GST Notice'),
  ('TDS Notice'),
  ('MCA Notice'),
  ('PF/ESI Notice'),
  ('Other');

-- ============================================================================
-- PASSWORD CATEGORIES
-- ============================================================================
INSERT INTO password_categories (name, sort_order) VALUES
  ('Government Portal', 1),
  ('Banking', 2),
  ('Email', 3),
  ('Software', 4),
  ('Social Media', 5),
  ('Other', 6);

-- ============================================================================
-- COMPLIANCE FORMS
-- ============================================================================
INSERT INTO compliance_forms (compliance_type, form_name, description, frequency, default_due_day) VALUES
  -- GST
  ('gst', 'GSTR-1 (Monthly)', 'Outward supplies', 'monthly', 11),
  ('gst', 'GSTR-1 (Quarterly)', 'Outward supplies - QRMP', 'quarterly', 13),
  ('gst', 'GSTR-3B (Monthly)', 'Summary return', 'monthly', 20),
  ('gst', 'GSTR-3B (Quarterly)', 'Summary return - QRMP', 'quarterly', 22),
  ('gst', 'GSTR-9', 'Annual return', 'yearly', NULL),
  ('gst', 'GSTR-9C', 'Reconciliation statement', 'yearly', NULL),
  ('gst', 'IFF', 'Invoice furnishing facility - QRMP', 'monthly', 13),
  -- Income Tax
  ('income_tax', 'ITR (Non-audit)', 'Income Tax Return - non-audit cases', 'yearly', NULL),
  ('income_tax', 'ITR (Audit)', 'Income Tax Return - audit cases', 'yearly', NULL),
  ('income_tax', 'Tax Audit Report', 'Form 3CA-3CD / 3CB-3CD', 'yearly', NULL),
  ('income_tax', 'Advance Tax Q1', 'Advance tax installment', 'quarterly', 15),
  ('income_tax', 'Advance Tax Q2', 'Advance tax installment', 'quarterly', 15),
  ('income_tax', 'Advance Tax Q3', 'Advance tax installment', 'quarterly', 15),
  ('income_tax', 'Advance Tax Q4', 'Advance tax installment', 'quarterly', 15),
  -- TDS
  ('tds', 'TDS Return (24Q)', 'Salary TDS return', 'quarterly', NULL),
  ('tds', 'TDS Return (26Q)', 'Non-salary TDS return', 'quarterly', NULL),
  ('tds', 'TDS Return (27Q)', 'TDS on NRI payments', 'quarterly', NULL),
  ('tds', 'TDS Return (27EQ)', 'TCS return', 'quarterly', NULL),
  -- MCA
  ('mca', 'AOC-4', 'Financial statements', 'yearly', NULL),
  ('mca', 'MGT-7/MGT-7A', 'Annual return', 'yearly', NULL),
  ('mca', 'DIR-3 KYC', 'Director KYC', 'yearly', NULL),
  ('mca', 'MSME-1', 'Outstanding payments to MSMEs', 'half_yearly', NULL),
  ('mca', 'ADT-1', 'Auditor appointment', 'yearly', NULL),
  ('mca', 'Form 11 (LLP)', 'LLP annual return', 'yearly', NULL),
  ('mca', 'Form 8 (LLP)', 'LLP statement of accounts', 'yearly', NULL);

-- ============================================================================
-- DEFAULT BILLING ORGANIZATION (placeholder)
-- ============================================================================
INSERT INTO billing_organizations (name, legal_name, is_default) VALUES
  ('Remote Munshi', 'Remote Munshi', true);

-- ============================================================================
-- MODULE SETTINGS
-- ============================================================================
INSERT INTO module_settings (module_name, is_enabled) VALUES
  ('leads', true),
  ('clients', true),
  ('services', true),
  ('tasks', true),
  ('invoices', true),
  ('dscs', true),
  ('licenses', true),
  ('passwords', true),
  ('documents', true),
  ('compliance', true),
  ('notices', true),
  ('team', true),
  ('attendance', true),
  ('leave', true),
  ('salary', true),
  ('chat', true),
  ('calendar', true),
  ('todos', true),
  ('sprints', true),
  ('reports', true),
  ('client_portal', true);

-- ============================================================================
-- INVOICE SEQUENCES
-- ============================================================================
INSERT INTO invoice_sequences (type, prefix, financial_year_id, next_number) VALUES
  ('proforma', 'PI', (SELECT id FROM financial_years WHERE is_current = true), 1),
  ('invoice', 'INV', (SELECT id FROM financial_years WHERE is_current = true), 1),
  ('reimbursement', 'RE', (SELECT id FROM financial_years WHERE is_current = true), 1);

-- ============================================================================
-- DEFAULT ROLE PERMISSIONS (Super Admin gets everything)
-- ============================================================================
DO $$
DECLARE
  admin_role_id UUID;
  mod TEXT;
  act TEXT;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'Super Admin';

  FOR mod IN SELECT unnest(ARRAY[
    'leads', 'clients', 'services', 'tasks', 'invoices',
    'dscs', 'licenses', 'passwords', 'documents', 'compliance',
    'notices', 'team', 'attendance', 'leave', 'salary',
    'chat', 'calendar', 'todos', 'sprints', 'reports',
    'settings', 'api_keys', 'webhooks'
  ]) LOOP
    FOR act IN SELECT unnest(ARRAY['create', 'read', 'update', 'delete', 'export']) LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed)
      VALUES (admin_role_id, mod, act, true);
    END LOOP;
  END LOOP;
END;
$$;
