-- ============================================================================
-- Remote Munshi CRM — Migration 00035: Lead Active/Inactive Status
-- Adds is_active flag to leads, updates KPI view to filter active-only
-- ============================================================================

-- Add is_active column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Partial index for fast active-lead queries
CREATE INDEX IF NOT EXISTS idx_leads_is_active
  ON leads (is_active) WHERE deleted_at IS NULL;

-- Backfill: mark already-converted leads as inactive
UPDATE leads SET is_active = false
  WHERE converted_client_id IS NOT NULL AND deleted_at IS NULL;

-- Replace v_lead_kpis: active-only for pipeline metrics, all for conversion_rate
DROP VIEW IF EXISTS v_lead_kpis;
CREATE VIEW v_lead_kpis AS
SELECT
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.is_active = true) AS total_leads,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.is_active = true AND l.created_at >= date_trunc('month', now())) AS leads_this_month,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.converted_client_id IS NOT NULL) AS converted_leads,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.is_active = true AND l.converted_client_id IS NULL) AS open_leads,
  CASE
    WHEN COUNT(*) FILTER (WHERE l.deleted_at IS NULL) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.converted_client_id IS NOT NULL)::NUMERIC /
      COUNT(*) FILTER (WHERE l.deleted_at IS NULL)::NUMERIC * 100, 1
    )
    ELSE 0
  END AS conversion_rate,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.is_active = true AND l.temperature = 'hot' AND l.converted_client_id IS NULL) AS hot_leads,
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.is_active = true AND l.next_follow_up <= CURRENT_DATE AND l.converted_client_id IS NULL) AS follow_ups_due
FROM leads l;
