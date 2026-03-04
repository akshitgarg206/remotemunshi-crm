export const EMPLOYEE_STATUS = ['active', 'inactive', 'on_leave', 'terminated'] as const
export type EmployeeStatus = typeof EMPLOYEE_STATUS[number]

export const LEAD_SOURCE = ['website', 'referral', 'social_media', 'cold_call', 'walk_in', 'linkedin', 'reddit', 'outlook', 'whatsapp', 'email', 'meeting', 'other'] as const
export type LeadSource = typeof LEAD_SOURCE[number]

export const LEAD_TEMPERATURE = ['hot', 'warm', 'cold'] as const
export type LeadTemperature = typeof LEAD_TEMPERATURE[number]

export const BUSINESS_ENTITY_TYPE = [
  'proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd',
  'opc', 'trust', 'society', 'huf', 'individual', 'other'
] as const
export type BusinessEntityType = typeof BUSINESS_ENTITY_TYPE[number]

export const CLIENT_STATUS = ['active', 'inactive', 'on_hold', 'closed'] as const
export type ClientStatus = typeof CLIENT_STATUS[number]

export const TASK_STATUS = ['pending', 'in_progress', 'in_review', 'request_changes', 'completed', 'on_hold', 'cancelled'] as const
export type TaskStatus = typeof TASK_STATUS[number]

export const TASK_PRIORITY = ['low', 'medium', 'high', 'urgent'] as const
export type TaskPriority = typeof TASK_PRIORITY[number]

export const RECURRENCE_FREQUENCY = ['daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly'] as const
export type RecurrenceFrequency = typeof RECURRENCE_FREQUENCY[number]


export const DSC_CLASS = ['class_2', 'class_3'] as const
export type DscClass = typeof DSC_CLASS[number]

export const DSC_STATUS = ['active', 'expired', 'revoked', 'pending'] as const
export type DscStatus = typeof DSC_STATUS[number]

export const DSC_LOCATION = ['with_us', 'with_client', 'with_vendor', 'other'] as const
export type DscLocation = typeof DSC_LOCATION[number]

export const DOC_DIRECTION = ['in', 'out', 'returned'] as const
export type DocDirection = typeof DOC_DIRECTION[number]

export const COMPLIANCE_STATUS = ['pending', 'in_progress', 'filed', 'not_applicable'] as const
export type ComplianceStatus = typeof COMPLIANCE_STATUS[number]

export const COMPLIANCE_TYPE = ['gst', 'income_tax', 'mca', 'tds', 'other'] as const
export type ComplianceType = typeof COMPLIANCE_TYPE[number]

export const NOTICE_STATUS = ['open', 'in_progress', 'resolved', 'closed'] as const
export type NoticeStatus = typeof NOTICE_STATUS[number]

export const LEAVE_STATUS = ['pending', 'approved', 'rejected', 'cancelled'] as const
export type LeaveStatus = typeof LEAVE_STATUS[number]

export const LEAVE_DAY_TYPE = ['full_day', 'first_half', 'second_half'] as const
export type LeaveDayType = typeof LEAVE_DAY_TYPE[number]

export const SPRINT_STATUS = ['planning', 'active', 'completed'] as const
export type SprintStatus = typeof SPRINT_STATUS[number]

export const CHAT_MESSAGE_TYPE = ['text', 'file', 'system'] as const
export type ChatMessageType = typeof CHAT_MESSAGE_TYPE[number]

export const CALENDAR_EVENT_TYPE = ['meeting', 'reminder', 'deadline', 'holiday', 'other'] as const
export type CalendarEventType = typeof CALENDAR_EVENT_TYPE[number]

export const COMMUNICATION_CHANNEL = ['whatsapp', 'email', 'phone', 'in_person', 'sms'] as const
export type CommunicationChannel = typeof COMMUNICATION_CHANNEL[number]

export const COMMUNICATION_DIRECTION = ['inbound', 'outbound'] as const
export type CommunicationDirection = typeof COMMUNICATION_DIRECTION[number]

export const NOTIFICATION_TYPE = ['task_assigned', 'task_updated', 'mention', 'comment', 'dsc_expiry', 'license_expiry', 'compliance_due', 'leave_request', 'system', 'ticket_created', 'ticket_escalated', 'conversation_assigned', 'escalation_received'] as const
export type NotificationType = typeof NOTIFICATION_TYPE[number]

// OmniDesk enums
export const CONVERSATION_STATUS = ['open', 'waiting', 'resolved', 'closed', 'spam'] as const
export type ConversationStatus = typeof CONVERSATION_STATUS[number]

export const TICKET_STATUS_V2 = ['open', 'pending', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'] as const
export type TicketStatusV2 = typeof TICKET_STATUS_V2[number]

export const TICKET_PRIORITY_V2 = ['low', 'medium', 'high', 'urgent'] as const
export type TicketPriorityV2 = typeof TICKET_PRIORITY_V2[number]

export const ESCALATION_TIER = ['tier_1', 'tier_2', 'tier_3'] as const
export type EscalationTier = typeof ESCALATION_TIER[number]

export const ESCALATION_STATUS = ['pending', 'acknowledged', 'in_progress', 'resolved', 'declined'] as const
export type EscalationStatus = typeof ESCALATION_STATUS[number]

export const OMNIDESK_MESSAGE_TYPE = ['text', 'image', 'file', 'audio', 'video', 'system'] as const
export type OmnideskMessageType = typeof OMNIDESK_MESSAGE_TYPE[number]

export const TEMPLATE_TRIGGER_TYPE = ['recurring', 'onboarding'] as const
export type TemplateTriggerType = typeof TEMPLATE_TRIGGER_TYPE[number]

export const ACTIVITY_CATEGORY = ['operations', 'experiment', 'marketing', 'automation'] as const
export type ActivityCategory = typeof ACTIVITY_CATEGORY[number]
