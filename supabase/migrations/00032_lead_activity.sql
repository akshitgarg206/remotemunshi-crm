-- ============================================================================
-- Remote Munshi CRM — Migration 00032: Lead Communications
-- Clone of client_communications pattern for leads
-- ============================================================================

CREATE TABLE lead_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
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

CREATE INDEX idx_lead_comms_lead ON lead_communications(lead_id, sent_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_comms_channel ON lead_communications(channel) WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_comms_employee ON lead_communications(employee_id) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage lead communications"
  ON lead_communications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
