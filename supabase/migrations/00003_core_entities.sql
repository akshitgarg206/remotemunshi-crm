-- ============================================================================
-- Remote Munshi CRM — Migration 00003: Core Entity Tables
-- ============================================================================

-- ============================================================================
-- EMPLOYEES
-- ============================================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,  -- Links to Supabase Auth (auth.users)
  employee_code TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  mobile TEXT,
  role_id UUID REFERENCES roles(id),
  designation_id UUID REFERENCES designations(id),
  department_id UUID REFERENCES departments(id),
  reporting_to UUID REFERENCES employees(id),
  status employee_status NOT NULL DEFAULT 'active',
  join_date DATE,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  salary NUMERIC(12,2) DEFAULT 0,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_auth_user ON employees(auth_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_status ON employees(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_department ON employees(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_role ON employees(role_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- SERVICES
-- ============================================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES service_categories(id),
  sac_code TEXT,
  description TEXT,
  default_rate NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_category ON services(category_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- LEADS
-- ============================================================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_number TEXT UNIQUE,
  business_name TEXT NOT NULL,
  contact_person TEXT,
  contact_no TEXT,
  email TEXT,
  source lead_source DEFAULT 'other',
  stage_id UUID REFERENCES lead_stages(id),
  referred_by TEXT,
  business_entity business_entity_type,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  converted_client_id UUID,
  converted_at TIMESTAMPTZ,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_stage ON leads(stage_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_source ON leads(source) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_created_by ON leads(created_by) WHERE deleted_at IS NULL;

-- ============================================================================
-- CLIENTS
-- ============================================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code TEXT UNIQUE,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  mobile TEXT,
  email TEXT,
  business_entity business_entity_type,
  gstin TEXT,
  pan TEXT,
  tan TEXT,
  cin TEXT,
  udyam_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pincode TEXT,
  gst_registration_date DATE,
  gst_type TEXT,  -- regular, composition, QRMP, etc.
  incorporation_date DATE,
  auditor_id UUID REFERENCES employees(id),
  status client_status NOT NULL DEFAULT 'active',
  -- Client portal
  portal_enabled BOOLEAN NOT NULL DEFAULT false,
  portal_email TEXT,
  portal_password_hash TEXT,
  -- Metadata
  notes TEXT,
  lead_id UUID REFERENCES leads(id),
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_status ON clients(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_business_entity ON clients(business_entity) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_auditor ON clients(auditor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_gstin ON clients(gstin) WHERE deleted_at IS NULL AND gstin IS NOT NULL;
CREATE INDEX idx_clients_pan ON clients(pan) WHERE deleted_at IS NULL AND pan IS NOT NULL;

-- ============================================================================
-- JUNCTION TABLES
-- ============================================================================

-- Lead Assignees
CREATE TABLE lead_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, employee_id)
);

-- Lead Services
CREATE TABLE lead_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  estimated_value NUMERIC(12,2) DEFAULT 0,
  UNIQUE(lead_id, service_id)
);

-- Client Assignees
CREATE TABLE client_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, employee_id)
);

-- Client Services
CREATE TABLE client_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  agreed_rate NUMERIC(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(client_id, service_id)
);

-- Client Group Members
CREATE TABLE client_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES client_groups(id) ON DELETE CASCADE,
  UNIQUE(client_id, group_id)
);

-- ============================================================================
-- Updated_at triggers
-- ============================================================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Back-reference: leads.converted_client_id FK (deferred because clients table didn't exist)
-- ============================================================================
ALTER TABLE leads ADD CONSTRAINT fk_leads_converted_client
  FOREIGN KEY (converted_client_id) REFERENCES clients(id);
