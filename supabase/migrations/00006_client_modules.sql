-- ============================================================================
-- Remote Munshi CRM — Migration 00006: Client Modules (DSC, Licenses, Passwords, Docs)
-- ============================================================================

-- ============================================================================
-- DSCs (Digital Signature Certificates)
-- ============================================================================
CREATE TABLE dscs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  holder_name TEXT NOT NULL,
  class dsc_class NOT NULL DEFAULT 'class_3',
  pan TEXT,
  issued_date DATE,
  expiry_date DATE,
  location dsc_location NOT NULL DEFAULT 'with_us',
  bin_number TEXT,
  vendor TEXT,
  token_number TEXT,
  password_encrypted BYTEA,
  status dsc_status NOT NULL DEFAULT 'active',
  remarks TEXT,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dscs_client ON dscs(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_dscs_status ON dscs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_dscs_expiry ON dscs(expiry_date) WHERE deleted_at IS NULL;

-- ============================================================================
-- LICENSES
-- ============================================================================
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  license_name TEXT NOT NULL,
  license_type TEXT,
  registration_no TEXT,
  issued_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  url TEXT,
  remarks TEXT,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_licenses_client ON licenses(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_licenses_expiry ON licenses(expiry_date) WHERE deleted_at IS NULL;

-- License Attachments
CREATE TABLE license_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CLIENT PASSWORDS (Encrypted Vault)
-- ============================================================================
CREATE TABLE client_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  category_id UUID REFERENCES password_categories(id),
  name TEXT NOT NULL,
  link TEXT,
  username TEXT,
  password_encrypted BYTEA NOT NULL,
  remark TEXT,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passwords_client ON client_passwords(client_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- DOCUMENTS IN/OUT
-- ============================================================================
CREATE TABLE documents_in_out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  document_name TEXT NOT NULL,
  person TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  direction doc_direction NOT NULL,
  returned_date DATE,
  remarks TEXT,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_docs_client ON documents_in_out(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_direction ON documents_in_out(direction) WHERE deleted_at IS NULL;

-- Document Files
CREATE TABLE document_in_out_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents_in_out(id) ON DELETE CASCADE,
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
CREATE TRIGGER set_updated_at BEFORE UPDATE ON dscs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON client_passwords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON documents_in_out FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
