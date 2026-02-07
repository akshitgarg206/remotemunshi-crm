-- Migration 00025: Contact Portal
-- Adds auth fields to contacts for magic-link portal access

-- Portal auth fields on contacts
ALTER TABLE contacts ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id);
ALTER TABLE contacts ADD COLUMN portal_enabled BOOLEAN NOT NULL DEFAULT false;

-- Indexes for portal queries
CREATE INDEX idx_contacts_auth_user_id ON contacts(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_contacts_portal_enabled ON contacts(portal_enabled) WHERE portal_enabled = true;

-- Enable RLS on contacts + client_contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users full access (employees use these policies)
CREATE POLICY contacts_authenticated_all ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY client_contacts_authenticated_all ON client_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Portal: contacts can read their own row
CREATE POLICY contacts_portal_self_read ON contacts
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Portal: contacts can read their client_contacts links
CREATE POLICY client_contacts_portal_read ON client_contacts
  FOR SELECT USING (
    contact_id IN (SELECT id FROM contacts WHERE auth_user_id = auth.uid())
  );

-- Portal: contacts can read linked clients
CREATE POLICY clients_portal_read ON clients
  FOR SELECT USING (
    id IN (
      SELECT cc.client_id FROM client_contacts cc
      JOIN contacts c ON c.id = cc.contact_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Portal: contacts can read tasks for their linked clients
CREATE POLICY tasks_portal_read ON tasks
  FOR SELECT USING (
    client_id IN (
      SELECT cc.client_id FROM client_contacts cc
      JOIN contacts c ON c.id = cc.contact_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Portal: contacts can read service_deadlines for their linked clients
CREATE POLICY service_deadlines_portal_read ON service_deadlines
  FOR SELECT USING (
    client_id IN (
      SELECT cc.client_id FROM client_contacts cc
      JOIN contacts c ON c.id = cc.contact_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Portal: contacts can read documents for their linked clients
CREATE POLICY documents_in_out_portal_read ON documents_in_out
  FOR SELECT USING (
    client_id IN (
      SELECT cc.client_id FROM client_contacts cc
      JOIN contacts c ON c.id = cc.contact_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Portal: contacts can read compliance for their linked clients
CREATE POLICY compliance_entries_portal_read ON compliance_entries
  FOR SELECT USING (
    client_id IN (
      SELECT cc.client_id FROM client_contacts cc
      JOIN contacts c ON c.id = cc.contact_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Portal: contacts can read DSCs for their linked clients
CREATE POLICY dscs_portal_read ON dscs
  FOR SELECT USING (
    client_id IN (
      SELECT cc.client_id FROM client_contacts cc
      JOIN contacts c ON c.id = cc.contact_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Portal: contacts can read licenses for their linked clients
CREATE POLICY licenses_portal_read ON licenses
  FOR SELECT USING (
    client_id IN (
      SELECT cc.client_id FROM client_contacts cc
      JOIN contacts c ON c.id = cc.contact_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Portal: contacts can read services linked to their clients
CREATE POLICY services_portal_read ON services
  FOR SELECT USING (
    id IN (
      SELECT cs.service_id FROM client_services cs
      WHERE cs.client_id IN (
        SELECT cc.client_id FROM client_contacts cc
        JOIN contacts c ON c.id = cc.contact_id
        WHERE c.auth_user_id = auth.uid()
      )
    )
  );

-- Portal: contacts can read notices for their linked clients
CREATE POLICY notices_portal_read ON notices
  FOR SELECT USING (
    client_id IN (
      SELECT cc.client_id FROM client_contacts cc
      JOIN contacts c ON c.id = cc.contact_id
      WHERE c.auth_user_id = auth.uid()
    )
  );
