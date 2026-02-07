# Remote Munshi CRM — API Reference

**Base URL:** `/api/v1`
**Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Pagination](#pagination)
5. [RBAC & Permissions](#rbac--permissions)
6. [Error Codes](#error-codes)
7. [Endpoints](#endpoints)
   - [Auth](#auth)
   - [Clients](#clients)
   - [Contacts](#contacts)
   - [Leads](#leads)
   - [Services](#services)
   - [Tasks](#tasks)
   - [Task Templates](#task-templates)
   - [Team (Employees)](#team-employees)
   - [DSCs (Digital Signatures)](#dscs-digital-signatures)
   - [Licenses](#licenses)
   - [Compliance](#compliance)
   - [Notices](#notices)
   - [Bundles](#bundles)
   - [Deadlines (Data Tracker)](#deadlines-data-tracker)
   - [Notifications](#notifications)
   - [Webhooks](#webhooks)
   - [CSV Import](#csv-import)
   - [OmniDesk Support](#omnidesk-support)
8. [Webhook Events](#webhook-events)

---

## Overview

All API routes are under `/api/v1/`. The API uses JSON request/response bodies. All endpoints require authentication via Supabase session cookies (set during login) unless otherwise noted.

All IDs are UUIDs. All timestamps are ISO 8601 format. Soft-deleted records (with `deleted_at` set) are excluded from all queries.

---

## Authentication

### Session-based (Primary)

1. Call `POST /api/v1/auth/login` with email + password
2. Supabase sets session cookies automatically
3. All subsequent requests use these cookies

### API Key (Planned)

Pass `Authorization: Bearer rm_api_key_<key>` header. API key validation is stubbed but not yet active.

### Password Reset Flow

1. User visits `/forgot-password`, enters email
2. Supabase sends a reset link to the email
3. User clicks link, lands on `/reset-password`
4. Supabase JS client exchanges the URL token automatically (`PASSWORD_RECOVERY` event)
5. User sets new password via `supabase.auth.updateUser({ password })`

---

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }       // Only on paginated list endpoints
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [...]     // Only on VALIDATION_ERROR (Zod issues)
  }
}
```

---

## Pagination

All list endpoints support pagination via query parameters:

| Parameter  | Default | Max  | Description |
|------------|---------|------|-------------|
| `page`     | 1       | —    | Page number (1-indexed) |
| `pageSize` | 20      | 100  | Items per page |
| `sortBy`   | `created_at` | — | Column to sort by |
| `sortOrder`| `desc`  | —    | `asc` or `desc` |
| `search`   | —       | —    | Full-text search (fields vary by endpoint) |

### Pagination Meta

```json
{
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## RBAC & Permissions

Every route (except auth and notifications) is protected by role-based permissions.

Permissions are checked as `module` + `action`:
- **Actions:** `create`, `read`, `update`, `delete`, `export`
- **Modules:** `clients`, `leads`, `services`, `tasks`, `dscs`, `licenses`, `compliance`, `notices`, `bundles`, `communications`, `team`, `webhooks`

**Admin users** (`is_admin = true`) bypass all permission checks.

Permission scopes (stored in DB, not yet enforced at query level):
- `all` — Access everything
- `department` — Same department only
- `team` — Reporting hierarchy
- `assigned` — Assigned records only
- `own` — Created by self only

If denied, the API returns:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to read clients"
  }
}
```
**HTTP Status:** `403`

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | No valid session / not logged in |
| `AUTH_FAILED` | 401 | Invalid email or password |
| `FORBIDDEN` | 403 | Role lacks required permission |
| `NOT_FOUND` | 404 | Resource does not exist or was soft-deleted |
| `VALIDATION_ERROR` | 400 | Zod schema validation failed (check `details`) |
| `ALREADY_CONVERTED` | 400 | Lead was already converted to a client |
| `REVIEW_PENDING` | 400 | Task has pending reviews and can't be completed directly |
| `INVALID_STATE` | 400 | Operation not valid for current resource state |
| `AUTH_ERROR` | 400 | Supabase auth operation failed (e.g., email change) |
| `INVALID_MODULE` | 400 | Unknown CSV import module |
| `NO_FILE` | 400 | No file uploaded for CSV import |
| `CONFIG_ERROR` | 503 | Server-side configuration missing (e.g., AI API key) |
| `AI_ERROR` | 502 | Upstream AI service failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### Auth

#### `POST /auth/login`
**Auth:** None required
**Body:**
```json
{ "email": "user@example.com", "password": "..." }
```
**Response:** `{ user, employee, session: { access_token, refresh_token, expires_at } }`

---

#### `GET /auth/me`
**Permission:** Authenticated (no module permission needed)
**Response:** `{ user, employee, permissions: [{ module, action, allowed, scope }] }`

Returns the current user's profile, employee record (with role, department, designation), and full permission matrix for client-side RBAC.

---

#### `POST /auth/logout`
**Auth:** None required (clears session)
**Response:** `{ message: "Logged out" }`

---

### Clients

#### `GET /clients`
**Permission:** `clients.read`
**Filters:** `status`, `business_entity`, `auditor_id`, `group_id`
**Search:** business_name, contact_name, email, gstin, pan
**Response:** Paginated list with `client_assignees`, `client_services`

---

#### `POST /clients`
**Permission:** `clients.create`
**Body:**
```json
{
  "business_name": "Acme Corp",
  "contact_name": "John",
  "email": "john@acme.com",
  "mobile": "9876543210",
  "business_entity": "private_limited",
  "pan": "AABCA1234A",
  "gstin": "07AABCA1234A1Z5",
  "address": "...",
  "city": "Mumbai",
  "state": "Maharashtra",
  "assignee_ids": ["uuid", ...],
  "service_ids": ["uuid", ...],
  "group_ids": ["uuid", ...]
}
```
**Response:** `201` with created client

---

#### `GET /clients/:id`
**Permission:** `clients.read`
**Response:** Client with assignees (employees), services, group_members

---

#### `PUT /clients/:id`
**Permission:** `clients.update`
**Body:** Same as create (all fields optional). Providing `assignee_ids`, `service_ids`, or `group_ids` replaces the full set.
**Response:** Updated client

---

#### `DELETE /clients/:id`
**Permission:** `clients.delete`
**Behavior:** Soft delete (sets `deleted_at`)
**Response:** `{ id, deleted: true }`

---

#### `GET /clients/kpi`
**Permission:** `clients.read`
**Response:** Aggregated KPI metrics from `v_client_kpis` view

---

#### `GET /clients/:id/communications`
**Permission:** `communications.read`
**Filters:** `channel`
**Response:** Paginated list of client communications with employee info, sorted by `sent_at desc`

---

#### `POST /clients/:id/communications`
**Permission:** `communications.create`
**Body:**
```json
{
  "channel": "email|whatsapp|phone|sms",
  "direction": "inbound|outbound",
  "subject": "Meeting follow-up",
  "body": "...",
  "from_contact": "...",
  "to_contact": "...",
  "sent_at": "2026-01-15T10:00:00Z"
}
```
**Response:** `201` with created communication

---

#### `GET /clients/:id/communications/:commId`
**Permission:** `communications.read`

#### `PUT /clients/:id/communications/:commId`
**Permission:** `communications.update`

#### `DELETE /clients/:id/communications/:commId`
**Permission:** `communications.delete`
**Behavior:** Soft delete

---

#### `GET /clients/:id/bundles`
**Permission:** `bundles.read`
**Response:** List of bundles assigned to this client

---

#### `POST /clients/:id/bundles`
**Permission:** `bundles.create`
**Body:**
```json
{
  "bundle_id": "uuid",
  "agreed_price": 50000,
  "start_date": "2026-04-01",
  "end_date": "2027-03-31"
}
```
**Side effect:** Also creates `client_services` rows for each service in the bundle.
**Response:** `201` with client_bundle record

---

#### `GET /clients/:id/contacts`
**Permission:** `clients.read`
**Response:** Linked contacts with role, is_primary flag

---

#### `POST /clients/:id/contacts`
**Permission:** `clients.update`
**Body:**
```json
{
  "contact_id": "uuid",
  "role": "Director",
  "is_primary": true
}
```
**Behavior:** Upsert (creates or updates the link)

---

#### `DELETE /clients/:id/contacts?contact_id=uuid`
**Behavior:** Unlinks contact from client (hard delete of junction row)

---

#### `GET /clients/:id/template-overrides`
**Permission:** `clients.read`
**Response:** Per-client template overrides with linked recurring_task + service info

---

#### `POST /clients/:id/template-overrides`
**Permission:** `clients.update`
**Body:**
```json
{
  "recurring_task_id": "uuid",
  "additional_steps": [{ "title": "Extra step", "sort_order": 0 }],
  "notes": "Special handling for this client"
}
```
**Behavior:** Upsert on `(client_id, recurring_task_id)`

---

#### `DELETE /clients/:id/template-overrides?template_id=uuid`
**Permission:** `clients.delete`

---

### Contacts

#### `GET /contacts`
**Permission:** `clients.read`
**Filters:** `client_id`
**Search:** name, email, mobile, designation
**Response:** Paginated list with linked client info via `client_contacts`

---

#### `POST /contacts`
**Permission:** `clients.create`
**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "mobile": "9876543210",
  "designation": "CFO",
  "department": "Finance",
  "notes": "...",
  "client_ids": [
    { "client_id": "uuid", "role": "Director", "is_primary": true }
  ]
}
```
**Response:** `201` with created contact

---

#### `GET /contacts/:id` | `PUT /contacts/:id` | `DELETE /contacts/:id`
Standard CRUD. PUT replaces `client_ids` array if provided.

---

### Leads

#### `GET /leads`
**Permission:** `leads.read`
**Filters:** `source`, `stage_id`, `created_by`
**Search:** business_name, contact_person, email
**Response:** Paginated list with assignees, services, lead_stages

---

#### `POST /leads`
**Permission:** `leads.create`
**Body:**
```json
{
  "business_name": "New Corp",
  "contact_person": "Alice",
  "email": "alice@new.com",
  "contact_no": "...",
  "source": "referral",
  "stage_id": "uuid",
  "business_entity": "llp",
  "assignee_ids": ["uuid"],
  "service_ids": ["uuid"]
}
```

---

#### `GET /leads/:id` | `PUT /leads/:id` | `DELETE /leads/:id`
Standard CRUD. `leads.read` / `leads.update` / `leads.delete`

---

#### `GET /leads/kpi`
**Permission:** `leads.read`
**Response:** Aggregated KPIs from `v_lead_kpis`

---

#### `POST /leads/:id/convert`
**Permission:** `leads.update`
**Body (optional):**
```json
{
  "client_data": {
    "business_name": "Override Name",
    "contact_name": "Override Contact",
    "email": "override@email.com"
  }
}
```
**Behavior:** Creates a client from the lead, copies assignees and services, marks lead as converted.
**Response:** `201` with `{ lead_id, client }`
**Errors:** `ALREADY_CONVERTED` if lead was previously converted

---

### Services

#### `GET /services`
**Permission:** `services.read`
**Search:** name, sac_code
**Response:** Paginated list with service_categories

---

#### `POST /services`
**Permission:** `services.create`

#### `GET /services/:id` | `PUT /services/:id` | `DELETE /services/:id`
Standard CRUD. `services.read` / `services.update` / `services.delete`

---

### Tasks

#### `GET /tasks`
**Permission:** `tasks.read`
**Filters:** `status`, `priority`, `client_id`, `service_id`, `sprint_id`, `assignee_id`, `parent_task_id`, `my_tasks`, `my_reviews`
**Search:** task_name, description

**Special filters:**
- `my_tasks=true` — Tasks assigned to the current user
- `my_reviews=true` — Tasks where current user is a reviewer and status is `in_review`
- By default, only top-level tasks are returned (not sub-tasks). Pass `parent_task_id` to list sub-tasks of a specific parent.

---

#### `POST /tasks`
**Permission:** `tasks.create`
**Body:**
```json
{
  "task_name": "File GST Return",
  "description": "...",
  "client_id": "uuid",
  "service_id": "uuid",
  "sprint_id": "uuid",
  "priority": "high",
  "status": "pending",
  "due_date": "2026-03-15",
  "estimated_hours": 4,
  "reviewer_1_id": "uuid",
  "reviewer_2_id": "uuid",
  "assignee_ids": ["uuid", "uuid"],
  "checklist": [
    { "title": "Collect data", "sort_order": 0 },
    { "title": "Verify entries", "sort_order": 1 }
  ]
}
```

---

#### `GET /tasks/:id`
**Permission:** `tasks.read`
**Response:** Full task with clients, services, assignees (employees), checklist_items, comments (employees), sub_statuses, sprints, recurring_tasks, reviewer_1, reviewer_2, and a separate `sub_tasks` array.

---

#### `PUT /tasks/:id`
**Permission:** `tasks.update`
**Body:** Same fields as create (all optional). `assignee_ids` replaces full set if provided.

**Review-aware status transitions:**
- Setting `status: "in_review"` automatically sets `current_review_level` and `review_X_status = "pending"`
- Setting `status: "completed"` is blocked if reviews are pending (returns `REVIEW_PENDING` error)
- Upon completion, `completed_at` is auto-set

---

#### `DELETE /tasks/:id`
**Permission:** `tasks.delete`
**Behavior:** Soft delete

---

#### `GET /tasks/summary`
**Permission:** `tasks.read`
**Response:** Task workload per employee from `v_task_summary`, sorted by employee_name

---

#### `GET /tasks/:id/comments`
**Permission:** `tasks.read`

#### `POST /tasks/:id/comments`
**Permission:** `tasks.create`
**Body:**
```json
{ "comment": "Updated the return.", "attachments": [] }
```

---

#### `GET /tasks/:id/checklist`
**Permission:** `tasks.read`

#### `POST /tasks/:id/checklist`
**Permission:** `tasks.create`
**Body:**
```json
{ "title": "New step", "sort_order": 5 }
```

#### `PATCH /tasks/:id/checklist`
**Permission:** `tasks.update`
**Body:**
```json
{ "id": "checklist-item-uuid", "is_checked": true }
```
Auto-sets `checked_by` and `checked_at` when checked.

---

#### `GET /tasks/:id/time-entries`
**Permission:** `tasks.read`

#### `POST /tasks/:id/time-entries`
**Permission:** `tasks.create`
**Body:** Time entry fields (date, hours, description, billable, etc.)

---

#### `GET /tasks/:id/sub-tasks`
**Permission:** `tasks.read`
**Response:** Sub-tasks with assignees and checklist items

#### `POST /tasks/:id/sub-tasks`
**Permission:** `tasks.create`
**Body:** Same as task create. `parent_task_id` is forced to the URL param.
**Constraint:** Max 2 levels deep. Creating a sub-task of a sub-task returns `VALIDATION_ERROR`.

---

#### `POST /tasks/:id/review`
**Permission:** `tasks.update`
**Body:**
```json
{ "action": "approve|request_changes", "comment": "Optional review note" }
```
**Behavior:**
- Validates that the current user is the reviewer for the current level
- `approve` at L1 with L2 reviewer: moves to L2. Without L2: completes the task.
- `approve` at L2: completes the task
- `request_changes`: sends back to assignee (`status: request_changes`)
- Creates a system comment logging the review action
- Uses optimistic locking on `current_review_level`

**Errors:** `INVALID_STATE` if task not in review, `FORBIDDEN` if not the correct reviewer

---

### Task Templates

#### `GET /task-templates`
**Permission:** `tasks.read`
**Filters:** `service_id`, `frequency`, `is_active`
**Search:** task_name, description
**Response:** Paginated list with services, clients, assignees (employees), reviewer_1, reviewer_2

---

#### `POST /task-templates`
**Permission:** `tasks.create`
**Extra check:** Requires `permission_level >= 5` on employee's role
**Body:** Template fields + `assignee_ids`

---

#### `GET /task-templates/:id` | `PUT /task-templates/:id` | `DELETE /task-templates/:id`
**Permission:** `tasks.read` / `tasks.update` / `tasks.delete`
**Extra check (PUT/DELETE):** Requires `permission_level >= min_edit_level` on the template

---

#### `POST /task-templates/:id/generate`
**Permission:** `tasks.create`
**Body:**
```json
{ "month": 3, "year": 2026 }
```
**Behavior:**
1. Finds target clients (template's client_id, or all clients subscribed to template's service)
2. Creates one task per client with period label (e.g., "Mar 2026")
3. Copies checklist items + assignees from template
4. Merges per-client template overrides (additional_steps + notes)
5. Updates `last_generated_at` on the template

**Response:** `201` with `{ tasks_created, period }`

---

### Team (Employees)

#### `GET /team`
**Permission:** `team.read`
**Filters:** `status`, `department_id`, `role_id`, `designation_id`
**Search:** name, email, mobile
**Response:** Paginated list with roles, designations, departments

---

#### `POST /team`
**Permission:** `team.create`
**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@remotemunshi.com",
  "password": "min6chars",
  "mobile": "...",
  "role_id": "uuid",
  "designation_id": "uuid",
  "department_id": "uuid",
  "reporting_to": "uuid",
  "status": "active",
  "join_date": "2026-01-15",
  "salary": 50000,
  "is_admin": false
}
```
**Side effect:** Creates a Supabase auth user with the given email + password (email auto-confirmed).
**Response:** `201` with employee record

---

#### `GET /team/:id`
**Permission:** `team.read`
**Response:** Employee with roles, designations, departments

---

#### `PUT /team/:id`
**Permission:** `team.update`
**Body:** Same fields as create (all optional), plus:
```json
{
  "email": "newemail@example.com",
  "reset_password": true
}
```
**Account transfer:** If `email` differs from current email, updates both the Supabase auth user email and the employee record. Returns `AUTH_ERROR` if auth update fails.
**Password reset:** If `reset_password: true`, generates a temporary password for the auth user.

---

#### `DELETE /team/:id`
**Permission:** `team.delete`
**Behavior:**
1. Soft-deletes the employee (sets `deleted_at`, `status: terminated`)
2. Bans the Supabase auth user (~100 year ban duration) to prevent login
**Response:** `{ id, deleted: true }`

---

### DSCs (Digital Signatures)

#### `GET /dscs`
**Permission:** `dscs.read`
**Filters:** `status`, `class`, `location`, `client_id`
**Search:** holder_name, bin_number, pan

#### `POST /dscs`
**Permission:** `dscs.create`

#### `GET /dscs/:id` | `PUT /dscs/:id` | `DELETE /dscs/:id`
Standard CRUD. `dscs.read/update/delete`

#### `GET /dscs/kpi`
**Permission:** `dscs.read`
**Response:** KPIs from `v_dsc_kpis`

---

### Licenses

#### `GET /licenses`
**Permission:** `licenses.read`
**Filters:** `client_id`
**Search:** license_name, registration_no

#### `POST /licenses`
**Permission:** `licenses.create`

#### `GET /licenses/:id`
**Response:** License with client info and `license_attachments`

#### `PUT /licenses/:id` | `DELETE /licenses/:id`
Standard update/delete. `licenses.update/delete`

#### `GET /licenses/kpi`
**Permission:** `licenses.read`

---

### Compliance

#### `GET /compliance`
**Permission:** `compliance.read`
**Filters:** `compliance_type`, `status`, `client_id`, `financial_year_id`
**Search:** form_name, reference_no

#### `POST /compliance`
**Permission:** `compliance.create`

#### `GET /compliance/:id`
**Response:** Entry with client info and `compliance_attachments`

#### `PUT /compliance/:id` | `DELETE /compliance/:id`
Standard. `compliance.update/delete`

#### `GET /compliance/kpi`
**Permission:** `compliance.read`

---

### Notices

#### `GET /notices`
**Permission:** `notices.read`
**Filters:** `status`, `client_id`, `notice_type_id`, `assigned_to`
**Search:** section, remarks

#### `POST /notices`
**Permission:** `notices.create`

#### `GET /notices/:id`
**Response:** Notice with client info, notice_types, and `notice_attachments`

#### `PUT /notices/:id` | `DELETE /notices/:id`
Standard. `notices.update/delete`

---

### Bundles

#### `GET /bundles`
**Permission:** `bundles.read`
**Search:** name, description
**Response:** Paginated list with `service_bundle_items` -> services

#### `POST /bundles`
**Permission:** `bundles.create`
**Body:**
```json
{
  "name": "GST Complete Package",
  "description": "...",
  "bundle_price": 25000,
  "service_ids": ["uuid", "uuid"]
}
```

#### `GET /bundles/:id`
**Response:** Bundle with full service details (name, sac_code, default_rate, service_categories)

#### `PUT /bundles/:id`
**Permission:** `bundles.update`
Providing `service_ids` replaces the full set.

#### `DELETE /bundles/:id`
**Permission:** `bundles.delete`
Soft delete.

---

### Deadlines (Data Tracker)

#### `GET /deadlines`
**Permission:** `services.read`
**Filters:** `service_id`, `client_id`, `status`, `month`, `year`
**Search:** client business_name, service name, period_label
**Response:** Paginated list with clients, services, data_received_by employee

---

#### `POST /deadlines/generate`
**Permission:** `services.create`
**Body:**
```json
{ "service_id": "uuid", "month": 3, "year": 2026 }
```
**Behavior:**
1. Fetches service deadline config (frequency, due_day, reminder_days)
2. Creates a deadline row per active client subscribed to the service (upsert, no duplicates)
3. Creates `deadline_reminders` per configured reminder day
4. Auto-creates tasks from active task templates for this service (with checklist, assignees, reviewers, per-client overrides)

**Response:** `201` with `{ generated: N, tasks_created: N }`
**Errors:** `NOT_FOUND` if service missing, `VALIDATION_ERROR` if service has no frequency

---

#### `GET /deadlines/kpi`
**Permission:** `services.read`
**Response:** KPIs from `v_deadline_kpis` (data_pending, received, overdue, due_this_week)

---

#### `GET /deadlines/:id`
**Permission:** `services.read`
**Response:** Deadline with client details, service config, data_received_by employee, linked task, and all `deadline_reminders`

---

#### `PUT /deadlines/:id`
**Permission:** `services.update`

---

#### `POST /deadlines/:id/receive-data`
**Permission:** `services.update`
**Body:** None required
**Behavior:**
1. Marks deadline as `data_received` with timestamp and receiving employee
2. Skips all pending reminders for this deadline
**Response:** Updated deadline

---

#### `POST /deadlines/:id/send-reminder`
**Permission:** `services.update`
**Body:**
```json
{
  "channel": "whatsapp|email|phone|sms",
  "message": "Optional custom message (overrides template)"
}
```
**Behavior:**
1. Builds message from service template or custom override
2. Creates a `client_communications` entry
3. Marks the next pending reminder as `sent`
**Errors:** `VALIDATION_ERROR` if data already received

---

### Notifications

#### `GET /notifications`
**Auth:** Authenticated (no module permission)
**Response:** Paginated notifications for the current user, sorted by `created_at desc`

---

#### `POST /notifications/mark-read`
**Auth:** Authenticated (no module permission)
**Body:**
```json
{ "notification_ids": ["uuid", ...] }
// OR
{ "mark_all": true }
```

---

### Webhooks

#### `GET /webhooks`
**Permission:** `webhooks.read`
**Response:** List of webhooks (without secrets) + `meta.available_events` array listing all subscribable events

---

#### `POST /webhooks`
**Permission:** `webhooks.create`
**Body:**
```json
{
  "name": "My Integration",
  "url": "https://example.com/webhook",
  "events": ["client.created", "task.completed"],
  "is_active": true
}
```
**Response:** `201` with webhook data including the `secret` (shown only on creation).

---

#### `GET /webhooks/:id` | `PUT /webhooks/:id` | `DELETE /webhooks/:id`
Standard CRUD. `webhooks.read/update/delete`. DELETE is a hard delete.

---

#### `GET /webhooks/:id/deliveries`
**Permission:** `webhooks.read`
**Response:** Paginated delivery log (event, payload, status, response_status, attempt)

---

### CSV Import

#### `GET /import/:module/template`
**Auth:** None required
**Modules:** `clients`, `leads`, `services`, `tasks`, `team`, `dscs`, `licenses`, `compliance`, `notices`
**Response:** CSV file download with headers and example row

---

#### `POST /import/:module`
**Auth:** Authenticated
**Content-Type:** `multipart/form-data`
**Form fields:** `file` (CSV file)
**Query params:** `validate=true` (validates only, no insert)

**Behavior:**
1. Parses CSV and validates against module template (types, required fields, enums)
2. For DSC/License/Compliance/Notice: resolves `Client Name` column to `client_id` via DB lookup
3. For Team: creates Supabase auth user per row (temp password: `{email_prefix}123!`)
4. Inserts rows one-by-one (failed rows don't block others)
5. Adds `created_by` for clients/leads/tasks

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "success": 47,
    "failed": 3,
    "errors": [
      { "row": 5, "field": "Email", "message": "Invalid email format" },
      { "row": 12, "field": "Client Name", "message": "Client \"XYZ\" not found" }
    ]
  }
}
```

---

### OmniDesk Support

#### Conversations

**`GET /support/conversations`**
**Permission:** `communications.read`
**Filters:** `status`, `channel`, `assigned_employee_id`, `is_spam`, `client_id`
**Search:** subject, last_message_preview

**`POST /support/conversations`**
**Permission:** `communications.create`

**`GET /support/conversations/:id`**
**Response:** Conversation with client, contact, assigned_employee, tickets, and all messages

**`PUT /support/conversations/:id`** | **`DELETE /support/conversations/:id`**
Standard update/soft-delete

---

#### Messages

**`GET /support/conversations/:id/messages`**
**Permission:** `communications.read`
**Default pageSize:** 50
**Response:** Messages sorted by `created_at asc` with sender employee info

**`POST /support/conversations/:id/messages`**
**Permission:** `communications.create`
**Body:**
```json
{
  "content": "Hello, how can I help?",
  "direction": "outbound",
  "message_type": "text",
  "is_internal": false,
  "channel": "whatsapp",
  "attachments": []
}
```
**Side effect:** Updates conversation's `last_message_at`, `last_message_preview`. Increments `unread_count` for inbound non-internal messages.

---

#### Assign & Takeover

**`POST /support/conversations/:id/assign`**
**Permission:** `communications.update`
**Body:** `{ "employee_id": "uuid" }`
**Side effect:** Creates system message about reassignment

**`POST /support/conversations/:id/takeover`**
**Permission:** `communications.update`
**Body:** None (assigns to current user)
**Side effect:** Creates system message about supervisor takeover

---

#### Tickets

**`GET /support/tickets`**
**Permission:** `communications.read`
**Filters:** `status`, `priority`, `assigned_employee_id`, `assigned_department_id`, `client_id`
**Search:** subject, ticket_number, description

**`POST /support/tickets`**
**Permission:** `communications.create`
**Note:** `ticket_number` is auto-generated by DB trigger (format: `TKT-XXXXX`)

**`GET /support/tickets/:id`**
**Response:** Ticket with client, contact, assigned_employee, assigned_department, conversation, and escalations

**`PUT /support/tickets/:id`**
**Permission:** `communications.update`
Setting `status: "resolved"` auto-sets `resolved_at`

**`DELETE /support/tickets/:id`**
Soft delete

---

#### Ticket KPIs

**`GET /support/tickets/kpi`**
**Permission:** `communications.read`
**Response:** KPIs from `v_support_kpis` (open_conversations, pending_tickets, unresolved_escalations, overdue_tickets, avg_first_response_minutes)

---

#### Escalations

**`GET /support/escalations`**
**Permission:** `communications.read`
**Filters:** `status`, `tier`, `to_department_id`, `to_employee_id`, `priority`

**`POST /support/escalations`**
**Permission:** `communications.create`
**Body:** Escalation fields (ticket_id, tier, reason, priority, to_employee_id, to_department_id)
**Side effect:** Creates notification for target employee

**`GET /support/escalations/:id`** | **`PUT /support/escalations/:id`**
Setting `status: "acknowledged"` auto-sets `acknowledged_at`. Setting `status: "resolved"` auto-sets `resolved_at`.

---

#### Quick Replies

**`GET /support/quick-replies`**
**Permission:** `communications.read`
**Filters:** `category`, `channel`, `is_global`
**Search:** title, content, shortcut

**`POST /support/quick-replies`**
**Permission:** `communications.create`

**`GET /support/quick-replies/:id`** | **`PUT /support/quick-replies/:id`** | **`DELETE /support/quick-replies/:id`**
Standard CRUD. `communications.read/update/delete`

---

#### AI Reply

**`POST /support/ai-reply`**
**Permission:** `communications.read`
**Body:**
```json
{
  "conversation_id": "uuid",
  "instruction": "Optional: be more formal"
}
```
**Behavior:** Fetches last 20 non-internal messages + client context, calls Claude API (claude-sonnet-4-5) to generate a professional reply suggestion.
**Response:** `{ reply: "Generated reply text..." }`
**Errors:** `CONFIG_ERROR` if `ANTHROPIC_API_KEY` not set, `AI_ERROR` on API failure

---

## Webhook Events

When creating a webhook, subscribe to these events:

| Event | Trigger |
|-------|---------|
| `client.created` | New client created |
| `client.updated` | Client record updated |
| `client.deleted` | Client soft-deleted |
| `lead.created` | New lead created |
| `lead.updated` | Lead record updated |
| `lead.converted` | Lead converted to client |
| `task.created` | New task created |
| `task.updated` | Task record updated |
| `task.status_changed` | Task status transition |
| `task.completed` | Task marked completed |
| `compliance.overdue` | Compliance entry past due |
| `compliance.filed` | Compliance entry filed |
| `dsc.expiring` | DSC approaching expiry |
| `dsc.expired` | DSC has expired |
| `license.expiring` | License approaching expiry |
| `license.expired` | License has expired |
| `employee.created` | New employee added |
| `payment.received` | Payment recorded |

### Webhook Delivery

**Headers sent with each webhook:**
```
Content-Type: application/json
X-Webhook-Signature: sha256=<HMAC-SHA256 hex digest>
X-Webhook-Event: client.created
User-Agent: RemoteMunshi-Webhook/1.0
```

**Payload format:**
```json
{
  "event": "client.created",
  "data": { ... },
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

**Signature verification:** Compute `HMAC-SHA256(webhook_secret, JSON.stringify(payload))` and compare with the value after `sha256=`.

**Retry policy:** 3 attempts with exponential backoff (~6s, ~36s, ~216s). Delivery status tracked in `webhook_deliveries` table. Timeout: 10 seconds per request.
