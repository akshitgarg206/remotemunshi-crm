-- ============================================================================
-- Migration 00022: OmniDesk — Omnichannel Customer Support Module
-- ============================================================================

-- ---- ENUMS ----

CREATE TYPE conversation_status AS ENUM ('open', 'waiting', 'resolved', 'closed', 'spam');
CREATE TYPE ticket_status_v2 AS ENUM ('open', 'pending', 'in_progress', 'waiting_on_customer', 'resolved', 'closed');
CREATE TYPE ticket_priority_v2 AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE escalation_tier AS ENUM ('tier_1', 'tier_2', 'tier_3');
CREATE TYPE escalation_status AS ENUM ('pending', 'acknowledged', 'in_progress', 'resolved', 'declined');
CREATE TYPE omnidesk_message_type AS ENUM ('text', 'image', 'file', 'audio', 'video', 'system');

-- Extend notification_type
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_escalated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'conversation_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'escalation_received';

-- ---- TABLES ----

-- 1. Support Conversations
CREATE TABLE support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  channel communication_channel NOT NULL DEFAULT 'whatsapp',
  status conversation_status NOT NULL DEFAULT 'open',
  assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  subject TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT,
  unread_count INT NOT NULL DEFAULT 0,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  sentiment_score NUMERIC(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2. Support Messages
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  direction communication_direction NOT NULL DEFAULT 'inbound',
  message_type omnidesk_message_type NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN NOT NULL DEFAULT false,
  channel communication_channel,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  conversation_id UUID REFERENCES support_conversations(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status ticket_status_v2 NOT NULL DEFAULT 'open',
  priority ticket_priority_v2 NOT NULL DEFAULT 'medium',
  assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  sla_due_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  tags JSONB DEFAULT '[]',
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 4. Support Escalations
CREATE TABLE support_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  tier escalation_tier NOT NULL DEFAULT 'tier_1',
  status escalation_status NOT NULL DEFAULT 'pending',
  priority ticket_priority_v2 NOT NULL DEFAULT 'medium',
  from_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  to_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  to_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  internal_note TEXT,
  sla_due_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Support Quick Replies
CREATE TABLE support_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  shortcut TEXT,
  channel communication_channel,
  is_global BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ---- TICKET NUMBER AUTO-GENERATION ----

CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || LPAD(nextval('support_ticket_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_ticket_number();

-- ---- UPDATED_AT TRIGGERS ----

CREATE TRIGGER set_updated_at_support_conversations
  BEFORE UPDATE ON support_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_support_tickets
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_support_escalations
  BEFORE UPDATE ON support_escalations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_support_quick_replies
  BEFORE UPDATE ON support_quick_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---- KPI VIEW ----

CREATE OR REPLACE VIEW v_support_kpis AS
SELECT
  (SELECT COUNT(*) FROM support_conversations WHERE status = 'open' AND deleted_at IS NULL) AS open_conversations,
  (SELECT COUNT(*) FROM support_conversations WHERE status = 'waiting' AND deleted_at IS NULL) AS waiting_conversations,
  (SELECT COUNT(*) FROM support_tickets WHERE status NOT IN ('resolved', 'closed') AND deleted_at IS NULL) AS pending_tickets,
  (SELECT COUNT(*) FROM support_escalations WHERE status NOT IN ('resolved', 'declined')) AS unresolved_escalations,
  (SELECT COUNT(*) FROM support_tickets WHERE sla_due_at < now() AND status NOT IN ('resolved', 'closed') AND deleted_at IS NULL) AS overdue_tickets,
  (SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60)
   FROM support_tickets WHERE first_response_at IS NOT NULL AND deleted_at IS NULL) AS avg_first_response_minutes;

-- ---- INDEXES ----

CREATE INDEX idx_support_conversations_status ON support_conversations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_conversations_assigned ON support_conversations(assigned_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_conversations_client ON support_conversations(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_conversations_channel ON support_conversations(channel) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_conversations_last_msg ON support_conversations(last_message_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX idx_support_messages_conversation ON support_messages(conversation_id, created_at DESC);
CREATE INDEX idx_support_messages_internal ON support_messages(conversation_id) WHERE is_internal = true;

CREATE INDEX idx_support_tickets_status ON support_tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_tickets_sla ON support_tickets(sla_due_at) WHERE status NOT IN ('resolved', 'closed') AND deleted_at IS NULL;
CREATE INDEX idx_support_tickets_conversation ON support_tickets(conversation_id);
CREATE INDEX idx_support_tickets_number ON support_tickets(ticket_number);

CREATE INDEX idx_support_escalations_status ON support_escalations(status);
CREATE INDEX idx_support_escalations_ticket ON support_escalations(ticket_id);
CREATE INDEX idx_support_escalations_to_emp ON support_escalations(to_employee_id) WHERE status = 'pending';
CREATE INDEX idx_support_escalations_to_dept ON support_escalations(to_department_id) WHERE status = 'pending';

-- ---- RLS POLICIES ----

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_quick_replies ENABLE ROW LEVEL SECURITY;

-- Conversations: employees can see all (filtered in app layer by assignment)
CREATE POLICY support_conversations_select ON support_conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY support_conversations_insert ON support_conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY support_conversations_update ON support_conversations FOR UPDATE TO authenticated USING (true);
CREATE POLICY support_conversations_delete ON support_conversations FOR DELETE TO authenticated USING (true);

-- Messages: employees can see all messages in conversations they have access to
CREATE POLICY support_messages_select ON support_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY support_messages_insert ON support_messages FOR INSERT TO authenticated WITH CHECK (true);

-- Tickets
CREATE POLICY support_tickets_select ON support_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY support_tickets_insert ON support_tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY support_tickets_update ON support_tickets FOR UPDATE TO authenticated USING (true);
CREATE POLICY support_tickets_delete ON support_tickets FOR DELETE TO authenticated USING (true);

-- Escalations
CREATE POLICY support_escalations_select ON support_escalations FOR SELECT TO authenticated USING (true);
CREATE POLICY support_escalations_insert ON support_escalations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY support_escalations_update ON support_escalations FOR UPDATE TO authenticated USING (true);

-- Quick Replies
CREATE POLICY support_quick_replies_select ON support_quick_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY support_quick_replies_insert ON support_quick_replies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY support_quick_replies_update ON support_quick_replies FOR UPDATE TO authenticated USING (true);
CREATE POLICY support_quick_replies_delete ON support_quick_replies FOR DELETE TO authenticated USING (true);

-- ---- ENABLE REALTIME ----

ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;
