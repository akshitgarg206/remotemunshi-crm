-- Migration: Contacts (many-to-many with clients) + Client Template Overrides
-- 1. Contacts table — shared contacts across clients
-- 2. client_contacts junction — N:M between clients and contacts
-- 3. client_template_overrides — per-client additional steps/notes for task templates

-- ============================================================================
-- CONTACTS
-- ============================================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  phone TEXT,
  designation TEXT,
  department TEXT,
  notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_name ON contacts(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON contacts(email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_contacts_mobile ON contacts(mobile) WHERE deleted_at IS NULL AND mobile IS NOT NULL;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLIENT_CONTACTS (N:M junction)
-- ============================================================================
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role TEXT, -- e.g. 'owner', 'accountant', 'director', 'authorized_signatory'
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, contact_id)
);

CREATE INDEX idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX idx_client_contacts_contact ON client_contacts(contact_id);

-- ============================================================================
-- CLIENT TEMPLATE OVERRIDES
-- Per-client additional steps and notes for task templates
-- ============================================================================
CREATE TABLE client_template_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  recurring_task_id UUID NOT NULL REFERENCES recurring_tasks(id) ON DELETE CASCADE,
  additional_steps JSONB DEFAULT '[]'::jsonb,  -- [{title, sort_order}]
  notes TEXT,  -- per-client implementation notes
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, recurring_task_id)
);

CREATE INDEX idx_client_template_overrides_client ON client_template_overrides(client_id);
CREATE INDEX idx_client_template_overrides_template ON client_template_overrides(recurring_task_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON client_template_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing contact fields to contacts table
-- NOTE: Run this after migration to copy existing data:
-- INSERT INTO contacts (name, email, mobile, created_by)
-- SELECT contact_name, email, mobile, created_by FROM clients
-- WHERE contact_name IS NOT NULL AND deleted_at IS NULL;
-- Then create client_contacts links. This is a data migration best done manually.

COMMENT ON TABLE contacts IS 'Shared contacts — one contact can belong to many clients, one client can have many contacts';
COMMENT ON TABLE client_contacts IS 'Many-to-many junction between clients and contacts with role context';
COMMENT ON TABLE client_template_overrides IS 'Per-client additional steps and notes for task templates';
COMMENT ON COLUMN client_template_overrides.additional_steps IS 'JSONB array: [{title: string, sort_order: number}] — appended to template steps when generating tasks';
COMMENT ON COLUMN client_template_overrides.notes IS 'Implementation notes specific to this client for this template';
