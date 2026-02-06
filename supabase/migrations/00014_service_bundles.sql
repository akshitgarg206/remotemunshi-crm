-- ============================================================================
-- Remote Munshi CRM — Migration 00014: Service Bundles
-- ============================================================================

CREATE TABLE service_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  bundle_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_bundles_active ON service_bundles(is_active) WHERE deleted_at IS NULL;

CREATE TABLE service_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES service_bundles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(bundle_id, service_id)
);

CREATE INDEX idx_bundle_items_bundle ON service_bundle_items(bundle_id);

CREATE TABLE client_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES service_bundles(id) ON DELETE CASCADE,
  agreed_price NUMERIC(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, bundle_id)
);

CREATE INDEX idx_client_bundles_client ON client_bundles(client_id);
CREATE INDEX idx_client_bundles_bundle ON client_bundles(bundle_id);

-- Triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE service_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_service_bundles ON service_bundles FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY insert_service_bundles ON service_bundles FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY update_service_bundles ON service_bundles FOR UPDATE TO authenticated
  USING (true);
CREATE POLICY delete_service_bundles ON service_bundles FOR DELETE TO authenticated
  USING (true);

CREATE POLICY select_bundle_items ON service_bundle_items FOR SELECT TO authenticated USING (true);
CREATE POLICY insert_bundle_items ON service_bundle_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY delete_bundle_items ON service_bundle_items FOR DELETE TO authenticated USING (true);

CREATE POLICY select_client_bundles ON client_bundles FOR SELECT TO authenticated USING (true);
CREATE POLICY insert_client_bundles ON client_bundles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_client_bundles ON client_bundles FOR UPDATE TO authenticated USING (true);
CREATE POLICY delete_client_bundles ON client_bundles FOR DELETE TO authenticated USING (true);
