-- ============================================================================
-- Remote Munshi CRM — Migration 00034: Leads use Service Packages (bundles)
-- Replaces lead_services with lead_bundles. Removes score & deal_value usage.
-- ============================================================================

-- Create lead_bundles junction table
CREATE TABLE IF NOT EXISTS lead_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES service_bundles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, bundle_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_bundles_lead ON lead_bundles(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_bundles_bundle ON lead_bundles(bundle_id);

-- RLS
ALTER TABLE lead_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_lead_bundles ON lead_bundles FOR SELECT TO authenticated USING (true);
CREATE POLICY insert_lead_bundles ON lead_bundles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY delete_lead_bundles ON lead_bundles FOR DELETE TO authenticated USING (true);

-- Drop and recreate v_lead_kpis without pipeline_value
DROP VIEW IF EXISTS v_lead_kpis;
CREATE VIEW v_lead_kpis AS
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
  COUNT(*) FILTER (WHERE l.deleted_at IS NULL AND l.next_follow_up <= CURRENT_DATE AND l.converted_client_id IS NULL) AS follow_ups_due
FROM leads l;
