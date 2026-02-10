# Remote Munshi CRM: Module Flows & Interlinkages

> **Last Updated:** 2026-02-06
> **Update Rule:** This file MUST be updated whenever modules, DB tables, API routes, or cross-module integrations change.

---

## 1. DATABASE RELATIONSHIPS MAP

### 1.1 Module Inventory (By Migration)

| Migration | Module | Tables | Purpose |
|-----------|--------|--------|---------|
| 00001 | Extensions & Enums | — | PostgreSQL extensions + 25 enum types |
| 00002 | Config/Settings | 19 | Departments, roles, designations, financial years, service categories, etc. |
| 00003 | Core Entities | 9 | Employees, services, leads, clients, junctions (assignees, services) |
| 00004 | Task Engine | 6 | Tasks, sprints, recurring tasks, task_assignees, checklist items, comments, time entries |
| 00005 | Invoicing | 4 | Invoices, line items, payments, recurring invoices (module removed from UI, tables remain) |
| 00006 | Client Modules | 8 | DSCs, licenses, passwords, documents in/out, attachments |
| 00007 | Compliance | 4 | Compliance entries, forms, notices, attachments |
| 00008 | HR Module | 4 | Attendance, leave requests, leave balances, salary records |
| 00009 | Communication | 6 | Chat channels, messages, calendar events, attendees |
| 00010 | System Tables | 9 | Notifications, mentions, activity logs, attachments, email, API keys, webhooks |
| 00011 | RLS & Functions | — | Row-level security policies, helper functions |
| 00012 | Views | 10 | KPI aggregations (leads, clients, tasks, DSCs, licenses, compliance, sales, timesheet) |
| 00014 | Service Bundles | 3 | Service bundles, bundle items, client bundles |
| 00015 | Communications | 1 | Client communications (channel logs) |
| 00016 | Todos → Tasks | — | Migration: todos merged into tasks table |
| 00017 | CA Firm Hierarchy | — | 13 roles + 12 departments + permission matrix |
| 00018 | Service Deadlines | 2 | service_deadlines, deadline_reminders + deadline_status enum + v_deadline_kpis view |
| 00019 | Task Review System | — | ALTER tasks: reviewer_1_id, reviewer_2_id, current_review_level, review statuses/timestamps/comments |
| 00020 | Task Template Enhancements | — | ALTER recurring_tasks: reviewer_1_id, reviewer_2_id, min_edit_level + indexes |
| 00021 | Contacts & Template Overrides | 3 | contacts, client_contacts (N:M junction), client_template_overrides (per-client template customization) |
| 00022 | OmniDesk Support | 5 | support_conversations, support_messages, support_tickets, support_escalations, support_quick_replies + 6 enums + v_support_kpis view + ticket_number auto-gen trigger + Supabase Realtime |
| 00024 | Onboarding Templates | — | ALTER recurring_tasks: trigger_type (recurring/onboarding), frequency nullable + partial index for onboarding lookup |
| 00025 | Contact Portal | — | ALTER contacts: auth_user_id (UUID FK → auth.users), portal_enabled (BOOLEAN). RLS policies on 11 tables for portal read access. |
| 00026 | WhatsApp Accounts | 1 | whatsapp_accounts (phone_number_id, waba_id, access_token, display_phone_number, status, is_default) + conversation lookup index |

### 1.2 Core FK Relationships

#### Employees (Central User Entity)
```
employees
├── role_id → roles
├── designation_id → designations
├── department_id → departments
├── reporting_to → employees (self-reference)
├── auth_user_id → Supabase auth.users (UNIQUE)
└── Referenced by 50+ tables as created_by, employee_id, assigned_to, etc.
```

#### Clients (Core Business Entity)
```
clients
├── auditor_id → employees
├── lead_id → leads (conversion link)
├── created_by → employees
└── Referenced by: tasks, DSCs, licenses, compliance, notices, invoices,
    communications, bundles, attendance, calendar, documents, passwords
```

#### Tasks (Execution Hub)
```
tasks
├── client_id → clients (nullable)
├── service_id → services (nullable)
├── sprint_id → sprints (nullable)
├── recurring_task_id → recurring_tasks (nullable)
├── parent_task_id → tasks (self-ref, max 2 levels)
├── sub_status_id → task_sub_statuses
├── created_by → employees
├── Children: task_assignees, task_checklist_items, task_comments, time_entries
└── Also linked from: compliance_entries.task_id, notices.task_id
```

#### Leads → Clients Conversion
```
leads.converted_client_id → clients.id (populated on conversion)
leads.converted_at ← TIMESTAMPTZ (set on conversion)
lead_assignees → client_assignees (copied on conversion)
lead_services → client_services (copied on conversion)
```

### 1.3 Cardinality Summary

| Relationship | Type | Notes |
|--------------|------|-------|
| Employees → Roles/Dept/Designation | N:1 | One each per employee |
| Employees → Employees (reporting_to) | N:1 | Manager hierarchy |
| Tasks ↔ Employees | N:M | Via task_assignees |
| Tasks → Tasks (parent) | N:1 | Sub-task hierarchy |
| Clients ↔ Contacts | N:M | Via client_contacts |
| Clients ↔ Services | N:M | Via client_services |
| Clients ↔ Bundles | N:M | Via client_bundles |
| Leads ↔ Services | N:M | Via lead_services |
| Services ↔ Bundles | N:M | Via service_bundle_items |
| Clients → DSCs/Licenses/Compliance/Notices | 1:N | Per-client tracking |
| Clients ↔ Services → Deadlines | 1:N | service_deadlines per client+service+period |
| Deadlines → Reminders | 1:N | deadline_reminders per deadline |
| Support Conversations → Clients | N:1 | client_id FK |
| Support Conversations → Contacts | N:1 | contact_id FK |
| Support Conversations → Employees | N:1 | assigned_employee_id FK |
| Support Messages → Conversations | N:1 | conversation_id FK (CASCADE) |
| Support Messages → Employees | N:1 | sender_employee_id FK |
| Support Tickets → Conversations | N:1 | conversation_id FK |
| Support Tickets → Clients/Contacts | N:1 | client_id, contact_id FKs |
| Support Tickets → Employees/Departments | N:1 | assigned_employee_id, assigned_department_id FKs |
| Support Escalations → Tickets | N:1 | ticket_id FK (CASCADE) |
| Support Escalations → Employees | N:1 | from_employee_id, to_employee_id FKs |
| Support Escalations → Departments | N:1 | to_department_id FK |

---

## 2. API ROUTES MAP

### 2.1 Endpoint Inventory (60 route files)

| Module | Routes | Endpoints |
|--------|--------|-----------|
| Auth | 3 | login, logout, me |
| Clients | 3 + 4 sub | CRUD + KPI + communications + bundles + contacts + template-overrides |
| Contacts | 2 | CRUD (list/create + detail/update/delete) |
| Leads | 4 | CRUD + KPI + convert-to-client |
| Tasks | 8 | CRUD + summary + comments + checklist + time-entries + sub-tasks + review |
| Task Templates | 3 | CRUD + generate from template (via recurring_tasks) |
| Services | 2 | CRUD |
| Team | 2 | CRUD + Supabase auth user creation |
| DSCs | 3 | CRUD + KPI |
| Licenses | 3 | CRUD + KPI |
| Compliance | 3 | CRUD + KPI |
| Notices | 2 | CRUD |
| Bundles | 2 | CRUD |
| Notifications | 2 | List + mark-read |
| Webhooks | 3 | CRUD + deliveries |
| Deadlines | 6 | List + generate + KPI + detail/update + receive-data + send-reminder |
| Import | 2 | Template download + CSV import (9 modules) |
| Support Conversations | 5 | CRUD + messages + assign + takeover |
| Support Tickets | 3 | CRUD + KPI |
| Support Escalations | 2 | List/create + detail/update |
| Support Quick Replies | 2 | CRUD |
| Support AI Reply | 1 | Generate reply via Claude API |
| Compliance Matrix | 2 | Matrix view (4 modes: service/period/client/group) + KPI aggregates |
| WhatsApp Accounts | 2 | List/create + detail/update/delete |
| WhatsApp Token Exchange | 1 | Exchange auth code → permanent access token |
| WhatsApp Webhook | 1 | GET verification + POST inbound messages/statuses (public, HMAC-secured) |

### 2.2 apiHandler Context

All routes use `apiHandler` wrapper injecting:
- `supabase` — authenticated Supabase client
- `userId` — Supabase auth.users UUID
- `employeeId` — employees.id (resolved from auth_user_id)
- `params` — route params ({id}, etc.)

### 2.3 Cross-Module Query Patterns

**Task List** joins: clients, services, task_assignees→employees, task_sub_statuses, sprints
**Task Detail** joins: all above + comments→employees, checklist_items, time_entries + separate sub-tasks query
**Client Detail** references: services, tasks, DSCs, licenses, passwords, documents, compliance, notices, bundles, communications

---

## 3. UI PAGE FLOWS

### 3.1 Navigation Topology

```
/(app)
├── /dashboard             — KPI overview (tasks/attendance/timesheet tabs)
├── /client                — Client list → /client/add, /client/{id} (12 tabs)
├── /leads                 — Lead list → /leads/add, /leads/{id}
├── /services              — Service list
├── /task                  — Task list (6 tabs: All, My Tasks, Pending, In Progress, In Review, Completed)
│   ├── /task/add          — Create task (supports ?parent_task_id for sub-tasks)
│   ├── /task/{id}         — Task detail (sub-tasks, checklist, time entries, comments)
│   ├── /task/templates    — Task template list
│   ├── /task/templates/add — Create template
│   └── /task/templates/{id} — Template detail + generate
├── /team                  — Employee list → /team/{id}
├── /digital-signature     — DSC list → /{id}
├── /license               — License list → /{id}
├── /notice-management     — Notice list → /{id}
├── /compliance-tracker    — Compliance list
├── /data-tracker          — Service deadline tracker → /data-tracker/{id}
├── /compliance-matrix     — Cross-client compliance matrix (4 views: service/period/client/group)
├── /bundles               — Bundle list → /bundles/add, /bundles/{id}
├── /support               — OmniDesk Agent Console (3-column: conversations | chat | context)
│   ├── /support/conversation/{id} — Conversation detail with escalation widgets
│   └── /support/supervisor — Supervisor queue (escalations, take-over, re-assign)
├── /settings              — 18 sub-pages (departments, roles, designations, quick-replies, etc.)
└── /(auth)/login          — Email/password login
```

### 3.2 Client Detail Tabs (14)
Overview | Services | Tasks | DSCs | Licenses | Passwords | Documents | Compliance | Notices | Bundles | Deadlines | Communications | Contacts | Template Notes

### 3.3 Task Detail Sections (5)
Header (status/priority badges) | Task Details card | Sub-Tasks (expandable with steps) | Checklist + Time Entries (side-by-side) | Comments

### 3.4 Standard List Page Pattern
All 9 list pages follow: KPI cards → Tabs → DataGrid (search, sort, pagination, clickable rows, import/export)

---

## 4. CROSS-MODULE INTEGRATION MATRIX

| From → To | Mechanism | Purpose |
|-----------|-----------|---------|
| Tasks → Clients | client_id FK | Scope task to client |
| Tasks → Services | service_id FK | Service delivery context |
| Tasks → Employees | task_assignees junction | Multi-assignee |
| Tasks → Tasks | parent_task_id self-ref | Sub-task hierarchy (max 2 levels) |
| Tasks → Sprints | sprint_id FK | Sprint grouping |
| Compliance → Tasks | task_id FK | Create task from deadline |
| Notices → Tasks | task_id FK | Create task for response |
| Leads → Clients | converted_client_id FK | Lead conversion |
| Clients ↔ Services | client_services junction | Subscribed services |
| Clients ↔ Bundles | client_bundles junction | Package assignment |
| Clients ↔ Employees | client_assignees junction | Team assignment |
| Services ↔ Bundles | service_bundle_items junction | Package composition |
| Time Entries → Tasks/Clients/Services | FKs | Billable hour attribution |
| Calendar → Tasks/Clients/Compliance | FKs | Event linking |
| Notifications → All modules | entity_type + entity_id | Polymorphic alerts |
| Webhooks → All modules | event triggers | External integration |
| Deadlines → Clients+Services | client_id + service_id FKs | Per-client deadline per service period |
| Deadlines → Tasks | task_id FK | Linked task for filing |
| Deadlines → Reminders | deadline_reminders child | Scheduled reminder schedule |
| Reminders → Communications | communication_id FK | Logged reminder as client communication |
| Services → Deadlines | frequency + due_day template | Deadline generation from service config |
| Templates → Tasks | recurring_task_id FK | Auto-create tasks from template on deadline generation |
| Templates → Deadlines | via generate route | Deadline gen checks for active templates per service |
| CSV Import → 9 modules | API routes | Bulk data loading |
| Contacts ↔ Clients | client_contacts junction | N:M contact sharing across clients |
| Templates → Client Overrides | client_template_overrides | Per-client additional steps + notes merged on task generation |
| Onboarding Templates → Clients | generateOnboardingTasks() | Auto-create tasks on client POST (universal + service-specific templates) |
| Onboarding Templates → Leads | generateOnboardingTasks() | Auto-create tasks on lead-to-client conversion |
| Support Conversations → Clients/Contacts | client_id + contact_id FKs | Customer identity on conversations |
| Support Conversations → Employees | assigned_employee_id FK | Agent assignment |
| Support Messages → Conversations | conversation_id FK | Message thread |
| Support Tickets → Conversations | conversation_id FK | Ticket linked to conversation |
| Support Tickets → Clients/Contacts | client_id + contact_id FKs | Customer identity on tickets |
| Support Escalations → Tickets | ticket_id FK | Escalation linked to ticket |
| Support Escalations → Employees/Departments | FKs | Routing (from/to agent, to dept) |
| Support → Notifications | entity_type + entity_id | ticket_created, ticket_escalated, conversation_assigned, escalation_received |
| Supabase Realtime → support_messages/conversations | postgres_changes | Live message + conversation updates |
| Claude API → AI Reply | /api/v1/support/ai-reply | Agent-reviewed AI-generated replies |
| Portal Auth → Contacts | auth_user_id FK | Magic link auth creates Supabase auth user linked to contact |
| Portal → Clients | client_contacts junction | Contacts see only their linked clients (read-only) |
| Portal → Tasks/Deadlines/Compliance/Documents/DSCs/Licenses/Notices | client_id FK | Scoped to contact's linked clients via portalHandler |
| WhatsApp Accounts → Employees | created_by FK | Account creator |
| WhatsApp Webhook → Contacts | mobile field lookup | Auto-create contact from WhatsApp sender |
| WhatsApp Webhook → Support Conversations | contact_id + channel + phone_number_id | Auto-create/find conversation per inbound message |
| WhatsApp Webhook → Support Messages | conversation_id FK | Inbound messages inserted with whatsapp_message_id in metadata |
| Support Messages (outbound) → WhatsApp Cloud API | phone_number_id from conversation metadata | Agent replies sent via WhatsApp when channel=whatsapp |
| WhatsApp Status Updates → Support Messages | metadata->>whatsapp_message_id | Delivery receipts (sent/delivered/read) stored in message metadata |

---

## 5. KEY BUSINESS WORKFLOWS

### Task Template Auto-Generation
Create task template (recurring_tasks) → Link to service → When deadlines generated for that service → Auto-create tasks per client with template's checklist, assignees, reviewers → Workers can add additional steps to generated tasks

### Client Onboarding Auto-Tasks
Create onboarding template (trigger_type='onboarding') → Optional: link to service (service-specific) or leave NULL (universal) → When new client is created (POST) or lead converted → generateOnboardingTasks() fires → Creates tasks with "{template.task_name} - Onboarding" + checklist + assignees + reviewers → Per-client overrides merged

### Lead-to-Client Conversion
Lead (with assignees + services) → POST /leads/{id}/convert → Client created with same assignees/services → Lead marked converted

### Task Execution
Create task → Assign to sprint (optional) → Assign employees → Add sub-tasks with steps → Log time → Check off checklist → Status progression (pending → in_progress → in_review → completed)

### Task Review (Optional Two-Level)
Configure reviewers on task creation (reviewer_1_id, reviewer_2_id) → Assignee submits for review (status=in_review) → L1 reviewer sees task in "My Reviews" tab → Approve (→ L2 if set, else completed) or Request Changes (→ back to assignee) → L2 reviewer approves → completed. Reviewers can add their own checklist items during review. System comments log all review transitions.

### Compliance Management
Create compliance entry per client/FY → Optionally create linked task → Track status → Upload attachments on filing

### Service Bundle Assignment
Create bundle (group of services) → Assign to client with agreed price/dates → Track on client detail Bundles tab

### Service Deadline Tracking (Data Collection)
Configure service with frequency + due_day + reminder_days → Generate deadlines per month → Per-client rows created with reminder schedule → Send reminders (manual/future: WhatsApp auto) → Mark data received → Skip remaining reminders → File return → Status: data_pending → data_received → in_progress → filed

### OmniDesk Support Workflow
Customer message arrives → Creates/updates conversation (channel: WhatsApp/Email/Phone/SMS) → Agent views in unified inbox → Replies or adds internal notes → Creates ticket if needed (auto TKT-XXXXX) → SLA timer tracks response time → If complex: escalate to supervisor (tier 1/2/3) → Supervisor can take over, re-assign, or whisper → AI generates reply suggestions → Agent reviews and sends → Ticket resolved → Conversation closed

---

## 6. DESIGN PATTERNS

- **Soft Deletes**: `deleted_at TIMESTAMPTZ` on all core tables
- **Polymorphic References**: `entity_type + entity_id` for notifications, activity_log, attachments
- **Junction Tables**: 10+ junction tables for N:M relationships
- **Self-Referencing**: employees.reporting_to, tasks.parent_task_id, chat_messages.reply_to
- **Role-Based Scoping**: role_permissions with scope (all/department/team/assigned/own)
- **employeeId in apiHandler**: All `created_by` fields use employees.id (not auth user UUID)

---

## 7. KPI VIEWS (11)

| View | Purpose |
|------|---------|
| v_lead_kpis | Lead pipeline metrics |
| v_client_kpis | Client portfolio health |
| v_task_summary | Task workload per assignee (excludes sub-tasks) |
| v_dsc_kpis | Certificate expiry tracking |
| v_license_kpis | License compliance |
| v_compliance_kpis | Regulatory deadline tracking |
| v_sales_summary | Revenue & receivables |
| v_timesheet_report | Billable hours by employee |
| v_revenue_by_user | Individual productivity |
| v_deadline_kpis | Service deadline status (data_pending, received, overdue, due_this_week) |
| v_support_kpis | OmniDesk metrics (open_conversations, pending_tickets, unresolved_escalations, overdue_tickets, avg_first_response_minutes) |
