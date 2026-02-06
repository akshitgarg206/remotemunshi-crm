# Bigger Picture

> **ACTIVE GOAL:** Build Remote Munshi CRM — full Turia clone with REST API + webhooks (Next.js 16 + Supabase)
>
> **STATUS:** CODE_RECOVERED_AND_COMMITTED
>
> **NEXT STEP:** All 254 source files recovered from disk (were never committed), git initialized, committed (312 files / 37,960 LOC), pushed to GitHub. Build passes (97 pages, 71 API routes, 0 errors). Vercel auto-deploy should trigger. Awaiting user direction.

**Last Updated:** 2026-02-06

---

## Current Objective

### Success Criteria
- [ ] Phase 1: Foundation (project, DB core, auth, layout, reusable components)
- [ ] Phase 2: Core Entities (clients, services, leads, settings)
- [ ] Phase 3: Task Engine
- [ ] Phase 4: Invoicing
- [ ] Phase 5: Compliance & Tracking
- [ ] Phase 6: Team Management
- [ ] Phase 7: Communication
- [ ] Phase 8: Reports
- [ ] Phase 9: API & Webhooks
- [ ] Phase 10: Client Portal & Polish

### What's Done
- Supabase client helpers created (`src/lib/supabase/` — client, server, admin, middleware)
- TanStack Query provider + Sonner toaster created (`src/components/providers.tsx`)
- Root layout updated with Providers wrapper, Inter font, CRM metadata (`src/app/layout.tsx`)
- API utilities created (`src/lib/api/` — handler, pagination, filters)
- Environment config templates created (`.env.local`, `.env.example`)
- Next.js middleware created (`src/middleware.ts` — session management via Supabase)
- AppShell layout built: sidebar, topbar, mobile-nav, (app) layout, (auth) layout
- Login page with email/password auth (`src/app/(auth)/login/page.tsx`)
- Dashboard page with tabbed KPI cards for tasks/attendance/timesheet/sales (`src/app/(app)/dashboard/page.tsx`)
- Root page redirects to /dashboard (`src/app/page.tsx`)
- Reusable DataGrid component with TanStack Table (`src/components/data-grid/data-grid.tsx`)
- Reusable KpiCard component with trend support (`src/components/kpi-cards/kpi-card.tsx`)
- Leads API routes: list/create, get/update/delete, convert-to-client, KPI view (`src/app/api/v1/leads/`)
- Services API routes: list/create, get/update/delete (`src/app/api/v1/services/`)
- Tasks API routes: full CRUD + comments, checklist, time-entries, summary (`src/app/api/v1/tasks/`)
- Invoices module REMOVED (accounting handled externally)
- Team API routes: list/create employees, get/update/delete with auth user creation (`src/app/api/v1/team/`)
- Webhook dispatcher with HMAC signing, delivery tracking, and retry logic (`src/lib/api/webhooks.ts`)
- Webhooks API routes: CRUD + deliveries (`src/app/api/v1/webhooks/`)
- Auth API routes: login, me, logout (`src/app/api/v1/auth/`)
- Todos merged into Tasks module — "My Tasks" tab replaces separate todo page
- Notifications API routes: list + mark-read (`src/app/api/v1/notifications/`)
- Detail pages: team member, DSC, license, notice-management (`src/app/(app)/*/[id]/page.tsx`)
- Settings sub-pages: departments, designations, roles & permissions, leave-types (`src/app/(app)/settings/*/page.tsx`)
- Settings sub-pages: billing-orgs, business-hours, holidays, financial-years (`src/app/(app)/settings/*/page.tsx`)
- Settings sub-pages: service-categories, lead-stages, task-sub-statuses, client-groups, notice-types, invoice-sequences (`src/app/(app)/settings/*/page.tsx`)
- Settings sub-pages: api-keys, webhooks, email-templates (`src/app/(app)/settings/*/page.tsx`)
- Client Communications: validator, list/create API, get/update/delete API, timeline component, log dialog (`src/components/communications/`, `src/app/api/v1/clients/[id]/communications/`)
- Service Bundles: validator, CRUD API, client assignment API, list page with create dialog, detail page (`src/lib/validators/bundles.ts`, `src/app/api/v1/bundles/`, `src/app/api/v1/clients/[id]/bundles/`, `src/app/(app)/bundles/`)
- CSV Import feature: templates (9 modules, no invoices), parser/validator, API routes (import + template download), UI components (`src/lib/import/`, `src/app/api/v1/import/`, `src/components/csv-import/`)
- Tasks + Todos merged: todos migrated → tasks table, todo module deleted, "My Tasks" tab added to task list
- Sub-tasks with steps: sub-tasks API (`/api/v1/tasks/[id]/sub-tasks/`), sub-tasks section in task detail with expandable steps, max 2-level nesting
- Task add page supports steps (checklist items) and `?parent_task_id` for creating sub-tasks
- Integration wiring: Bundles in sidebar + client detail tab, Communications tab in client detail, Import buttons on all 9 list pages
- DataGrid onRowClick: all 8 list pages with detail views now have clickable rows navigating to detail
- CA firm user hierarchy: 13 roles (Managing Partner→Article Assistant + Executive/Assistant), 12 departments, scoped permissions (all/department/team/assigned/own), permission_level on roles, hierarchy level on designations
- Service Deadlines API routes: list+filters, generate, KPI, get/update, receive-data, send-reminder (`src/app/api/v1/deadlines/`)
- Kanban board: dnd-kit drag-and-drop, KanbanBoard+KanbanCard components, List/Board view toggle on task page (persisted to localStorage)
- Task Templates (via recurring_tasks): migration 00020 (reviewer_1_id, reviewer_2_id, min_edit_level), validator, CRUD+generate API routes, hooks, list/detail/add pages, sidebar nav
- Auto-task creation on deadline generate: templates with matching service_id auto-create tasks with checklist + assignees + reviewers for each client deadline
- Contacts separated from clients: migration 00021, contacts table, client_contacts N:M junction, CRUD + link/unlink API routes, hooks, Contacts tab on client detail
- Per-client template overrides: client_template_overrides table, upsert/delete API routes, hooks, Template Notes tab on client detail
- Both generate routes (deadline + template) merge per-client overrides (additional_steps + notes) into generated tasks
- OmniDesk: Migration 00022, 6 enums, 5 validators, 11 API routes, 7 hooks, 15 UI components, 4 pages, sidebar nav, Zustand store, Supabase Realtime subscriptions, Claude AI reply generation
- Design System Overhaul: Branded blue primary color (oklch), next-themes ThemeProvider with light/dark/system, theme toggle in topbar, all layout components use design tokens (sidebar, topbar, mobile-nav), all 9+ support module components tokenized, all status badges use dark-mode-safe colors, KPI cards use bg-primary, settings/reports use primary/10 instead of hardcoded blue-50, kanban cards use bg-card tokens, all bg-white/bg-slate replaced
- Dead UI Button Fixes: Removed 3 empty handlers (onAdd×2 on passwords/documents, onExport on clients), created ComingSoon reusable component, created 4 topbar/mobile-nav placeholder pages (sprint-planner, chat, calendar, actions-center), created 14 report sub-route placeholder pages — all previously-404 links now render gracefully

### What's Left
1. Verify Vercel deployment works with env vars
2. Test auth flow end-to-end on live deployment
3. Any remaining feature additions per user request

---

## Project State

### Recently Completed
| Date | Item | Impact |
|------|------|--------|
| 2026-02-06 | Task module debugged end-to-end | Fixed created_by FK (employeeId in apiHandler), self-ref FK (separate sub-tasks query), checklist PATCH toggle |
| 2026-02-06 | Module flows documented | memory/module_flows.md: full DB/API/UI interlinkage map, added to CLAUDE.md checklist |
| 2026-02-06 | Client Communications feature | Logging-only comms per client: validator, 2 API routes, timeline component, log dialog |
| 2026-02-06 | Service Bundles feature | Full CRUD for bundles, client assignment, list+detail pages with service multi-select |
| 2026-02-06 | CSV Import feature | 9-module CSV import: templates, parser/validator, import+template API routes, dialog UI with preview |
| 2026-02-06 | CSV Import wired to all list pages | CsvImporter + onImport prop added to all 9 list pages (clients, leads, services, tasks, team, dscs, licenses, compliance, notices) |
| 2026-02-06 | Tasks + Todos merged | Todos migrated to tasks, todo module deleted, "My Tasks" tab, sub-tasks with steps, v_task_summary updated |
| 2026-02-06 | Invoicing module removed | All invoice routes/pages/validators/enums deleted, sidebar/dashboard/settings/reports cleaned |
| 2026-02-06 | Service deadlines DB + validators | Migration 00018 (service_deadlines, deadline_reminders, KPI view, RLS), services.ts updated with deadline fields, deadlines.ts validator created |
| 2026-02-06 | Service deadlines UI pages | use-deadlines.ts hooks, data-tracker list+detail pages, services/[id] detail page, services page updated with frequency/due_day columns + onRowClick + create form fields |
| 2026-02-06 | Data Tracker wired to sidebar + client | CalendarClock icon in sidebar nav, Deadlines tab (12th) added to client detail, migration 00018 applied to Supabase, module_flows.md updated |
| 2026-02-06 | Two-level task review system | Migration 00019 (reviewer columns on tasks), review API endpoint, review-aware status transitions, reviewer selects on task add, review status card + action card on task detail, "My Reviews" tab on task list, reviewers can add checklist steps |
| 2026-02-06 | Kanban board + Task Templates | dnd-kit Kanban with review guards, task templates via recurring_tasks with CRUD/generate APIs, auto-task creation on deadline generation, 3 template pages, sidebar nav |
| 2026-02-06 | Contacts + Template Overrides | Contacts separated from clients (N:M), per-client template overrides with additional_steps + notes, both generate routes merge overrides |
| 2026-02-06 | OmniDesk Omnichannel Support | Full support module: conversations, messages, tickets, escalations, quick replies, AI reply, supervisor portal, realtime messaging |

### Upcoming
| Item | Priority | Depends On |
|------|----------|------------|
| | | |

### Constraints
<!-- Hard limits that can't be changed -->
- **Deployment:** GitHub (`akshitgarg206/remotemunshi-crm`) + Vercel (auto-deploy on push)
- **Env vars needed on Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Learning Log

### Mistakes to Avoid
| Mistake | Root Cause | Prevention |
|---------|------------|------------|
| All app code lost after context clear | Code was written but never git committed/pushed. Memory files documented features that only existed in-session | MANDATORY: commit + push after every feature. Pre-context-clear git check added to CLAUDE.md |

### Patterns Discovered
| Pattern | Context | Document In |
|---------|---------|-------------|
| | | |

---

## Update Rules

1. **ALWAYS update the top block** (ACTIVE GOAL / STATUS / NEXT STEP) - this is the most critical section
2. **On new user request:** Overwrite "Current Objective" entirely
3. **On task completion:** Move to "Recently Completed", update top block
4. **During long tasks:** Update top block after each major step (don't let it go stale mid-work)
5. **On discovery:** Log in "Learning Log"
6. **On context clear:** This file is read FIRST - the top block must be current

---
