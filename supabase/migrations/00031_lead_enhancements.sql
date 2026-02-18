-- ============================================================================
-- Remote Munshi CRM — Migration 00031: Lead Enhancements
-- Adds scoring, pipeline value, follow-up, external source fields to leads
-- ============================================================================

-- Add new enum values to lead_source
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'linkedin';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'reddit';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'outlook';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'email';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'meeting';

-- Add new columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER CHECK (score >= 0 AND score <= 100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value NUMERIC(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_metadata JSONB DEFAULT '{}'::jsonb;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(temperature) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_expected_close ON leads(expected_close_date) WHERE deleted_at IS NULL AND converted_client_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(next_follow_up) WHERE deleted_at IS NULL AND converted_client_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_external ON leads(external_source, external_id) WHERE deleted_at IS NULL;

-- Replace v_lead_kpis view with enhanced version
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
  END AS conversion_rate,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.temperature = 'hot' AND l.converted_client_id IS NULL) AS hot_leads,
  COALESCE(SUM(l.deal_value) FILTER (WHERE l.deleted_at IS NULL AND l.converted_client_id IS NULL), 0) AS pipeline_value,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.next_follow_up <= CURRENT_DATE AND l.converted_client_id IS NULL) AS follow_ups_due
FROM leads l;
