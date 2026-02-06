-- ============================================================================
-- Remote Munshi CRM — Migration 00015: Client Communications
-- ============================================================================

CREATE TYPE communication_channel AS ENUM ('whatsapp', 'email', 'phone', 'in_person', 'sms');
CREATE TYPE communication_direction AS ENUM ('inbound', 'outbound');

CREATE TABLE client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel communication_channel NOT NULL,
  direction communication_direction NOT NULL DEFAULT 'outbound',
  subject TEXT,
  body TEXT,
  from_contact TEXT,
  to_contact TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  employee_id UUID REFERENCES employees(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_comms_client ON client_communications(client_id, sent_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_client_comms_channel ON client_communications(channel) WHERE deleted_at IS NULL;
CREATE INDEX idx_client_comms_employee ON client_communications(employee_id) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON client_communications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_client_comms ON client_communications FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY insert_client_comms ON client_communications FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY update_client_comms ON client_communications FOR UPDATE TO authenticated
  USING (true);
CREATE POLICY delete_client_comms ON client_communications FOR DELETE TO authenticated
  USING (true);
