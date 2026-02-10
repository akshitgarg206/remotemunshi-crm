-- ============================================================================
-- Migration 00026: WhatsApp Business API — Account Management
-- ============================================================================

-- WhatsApp Business accounts (connected via Embedded Signup)
CREATE TABLE whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id TEXT UNIQUE NOT NULL,
  waba_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  display_phone_number TEXT NOT NULL,
  business_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',  -- active | disconnected
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_whatsapp_accounts
  BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_whatsapp_accounts_status ON whatsapp_accounts(status);
CREATE INDEX idx_whatsapp_accounts_waba ON whatsapp_accounts(waba_id);

-- Composite index for fast conversation lookup by contact + channel
CREATE INDEX idx_support_conversations_contact_channel_status
  ON support_conversations(contact_id, channel, status)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY whatsapp_accounts_select ON whatsapp_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY whatsapp_accounts_insert ON whatsapp_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY whatsapp_accounts_update ON whatsapp_accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY whatsapp_accounts_delete ON whatsapp_accounts FOR DELETE TO authenticated USING (true);
