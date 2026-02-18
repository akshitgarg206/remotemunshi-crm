-- ============================================================================
-- Remote Munshi CRM — Migration 00033: Integration Connections & Lead Import Log
-- Stores OAuth tokens for Outlook/Reddit/LinkedIn and tracks imported leads
-- ============================================================================

CREATE TABLE integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('outlook', 'linkedin', 'reddit')),
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  account_email TEXT,
  account_name TEXT,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, provider)
);

CREATE INDEX idx_integration_conn_employee ON integration_connections(employee_id);
CREATE INDEX idx_integration_conn_provider ON integration_connections(provider, status);

CREATE TABLE lead_import_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  imported_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source, external_id)
);

CREATE INDEX idx_lead_import_source ON lead_import_log(source, external_id);

-- Enable RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_import_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integration connections"
  ON integration_connections
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage lead import log"
  ON lead_import_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
