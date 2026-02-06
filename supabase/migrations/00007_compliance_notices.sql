-- ============================================================================
-- Remote Munshi CRM — Migration 00007: Compliance & Notices
-- ============================================================================

-- ============================================================================
-- COMPLIANCE ENTRIES
-- ============================================================================
CREATE TABLE compliance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  compliance_type compliance_type NOT NULL,
  form_id UUID REFERENCES compliance_forms(id),
  form_name TEXT NOT NULL,
  financial_year_id UUID REFERENCES financial_years(id),
  period TEXT,  -- e.g., "Q1", "Apr", "2025-26"
  due_date DATE,
  filed_date DATE,
  acknowledgement_no TEXT,
  reference_no TEXT,
  status compliance_status NOT NULL DEFAULT 'pending',
  task_id UUID REFERENCES tasks(id),
  remarks TEXT,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_client ON compliance_entries(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_compliance_type ON compliance_entries(compliance_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_compliance_status ON compliance_entries(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_compliance_due_date ON compliance_entries(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_compliance_fy ON compliance_entries(financial_year_id) WHERE deleted_at IS NULL;

-- Compliance Attachments
CREATE TABLE compliance_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_entry_id UUID NOT NULL REFERENCES compliance_entries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- NOTICES
-- ============================================================================
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  notice_type_id UUID REFERENCES notice_types(id),
  section TEXT,
  assessment_year TEXT,
  date_of_issue DATE,
  date_of_receipt DATE,
  due_date DATE,
  response_date DATE,
  status notice_status NOT NULL DEFAULT 'open',
  remarks TEXT,
  task_id UUID REFERENCES tasks(id),
  assigned_to UUID REFERENCES employees(id),
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notices_client ON notices(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notices_status ON notices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_notices_due_date ON notices(due_date) WHERE deleted_at IS NULL;

-- Notice Attachments
CREATE TABLE notice_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Updated_at triggers
-- ============================================================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON compliance_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON notices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
