-- ============================================================================
-- Remote Munshi CRM — Migration 00001: Extensions & Enum Types
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'on_leave', 'terminated');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social_media', 'cold_call', 'walk_in', 'other');
CREATE TYPE business_entity_type AS ENUM (
  'proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd',
  'opc', 'trust', 'society', 'huf', 'individual', 'other'
);
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'on_hold', 'closed');
CREATE TYPE task_status AS ENUM (
  'pending', 'in_progress', 'in_review', 'request_changes',
  'completed', 'on_hold', 'cancelled'
);
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly');
CREATE TYPE invoice_type AS ENUM ('proforma', 'invoice', 'reimbursement');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'upi', 'cheque', 'credit_card', 'other');
CREATE TYPE dsc_class AS ENUM ('class_2', 'class_3');
CREATE TYPE dsc_status AS ENUM ('active', 'expired', 'revoked', 'pending');
CREATE TYPE dsc_location AS ENUM ('with_us', 'with_client', 'with_vendor', 'other');
CREATE TYPE doc_direction AS ENUM ('in', 'out', 'returned');
CREATE TYPE compliance_status AS ENUM ('pending', 'in_progress', 'filed', 'not_applicable');
CREATE TYPE compliance_type AS ENUM ('gst', 'income_tax', 'mca', 'tds', 'other');
CREATE TYPE notice_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE leave_day_type AS ENUM ('full_day', 'first_half', 'second_half');
CREATE TYPE sprint_status AS ENUM ('planning', 'active', 'completed');
CREATE TYPE chat_message_type AS ENUM ('text', 'file', 'system');
CREATE TYPE calendar_event_type AS ENUM ('meeting', 'reminder', 'deadline', 'holiday', 'other');
CREATE TYPE notification_type AS ENUM (
  'task_assigned', 'task_updated', 'mention', 'comment',
  'dsc_expiry', 'license_expiry', 'invoice_overdue',
  'compliance_due', 'leave_request', 'system'
);
