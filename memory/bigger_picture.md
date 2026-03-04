# Bigger Picture

> **ACTIVE GOAL:** 15-Minute Activity Timer — productivity timer with beep, entry logging, category tracking, missed block detection
>
> **STATUS:** IN PROGRESS — Starting implementation (9 phases)
>
> **NEXT STEP:** Phase 1: Database migration 00036

**Last Updated:** 2026-02-28

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
- Client Onboarding Templates: migration 00024 (trigger_type enum, frequency nullable), validator with superRefine, generateOnboardingTasks utility, API filter/guards, client POST + lead conversion hooks, UI tabs (recurring/onboarding), conditional add/detail pages
- OmniDesk: Migration 00022, 6 enums, 5 validators, 11 API routes, 7 hooks, 15 UI components, 4 pages, sidebar nav, Zustand store, Supabase Realtime subscriptions, Claude AI reply generation
- Design System Overhaul: Branded blue primary color (oklch), next-themes ThemeProvider with light/dark/system, theme toggle in topbar, all layout components use design tokens (sidebar, topbar, mobile-nav), all 9+ support module components tokenized, all status badges use dark-mode-safe colors, KPI cards use bg-primary, settings/reports use primary/10 instead of hardcoded blue-50, kanban cards use bg-card tokens, all bg-white/bg-slate replaced
- Dead UI Button Fixes: Removed 3 empty handlers (onAdd×2 on passwords/documents, onExport on clients), created ComingSoon reusable component, created 4 topbar/mobile-nav placeholder pages (sprint-planner, chat, calendar, actions-center), created 14 report sub-route placeholder pages — all previously-404 links now render gracefully
- Leads Module Enhancement (8 phases): migrations 00031-00033, lead stages settings, enhanced add/detail pages, pipeline kanban, WhatsApp convert-to-lead, Outlook/Reddit/LinkedIn integrations
- Active/Inactive Leads + Outlook Meeting Cron — IN PROGRESS

### What's Left
1. ~~Verify Vercel deployment works~~ — DONE
2. ~~Performance: login static + Mumbai region~~ — DONE
3. ~~Create test user account~~ — DONE
4. ~~Execute Contact Portal plan~~ — DONE
5. Test auth flow end-to-end on live deployment
6. Any remaining feature additions per user request

---

## Project State

### Recently Completed
| Date | Item | Impact |
|------|------|--------|
| 2026-02-18 | Leads Module Enhancement — Phases 1-8 | Full lead pipeline: kanban, scoring, integrations (Outlook, Reddit, LinkedIn, WhatsApp) |
| 2026-02-12 | WhatsApp multi-provider + OmniDesk | YCloud + ChakraHQ providers, per-channel inbox, contact picker |
| 2026-02-10 | WhatsApp Business API Integration | Cloud API client, webhooks, inbound processor, Settings page |
| 2026-02-09 | UI/UX Polish (5 waves) + Visual Smoke Testing | Complete design overhaul, 12 pages verified |

### Upcoming
| Item | Priority | Depends On |
|------|----------|------------|
| | | |

### Constraints
- **Deployment:** GitHub (`akshitgarg206/remotemunshi-crm`) + Vercel (auto-deploy on push)
- **Env vars needed on Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Learning Log

### Mistakes to Avoid
| Mistake | Root Cause | Prevention |
|---------|------------|------------|
| All app code lost after context clear | Code was written but never git committed/pushed. Memory files documented features that only existed in-session | MANDATORY: commit + push after every feature. Pre-context-clear git check added to CLAUDE.md |
| Vercel 404 on production | Production branch was `master` (scaffold), CRM code was on `main`. Two unrelated git histories | Always push to BOTH `main` and `master`: `git push origin main && git push origin main:master` |

### Patterns Discovered
| Pattern | Context | Document In |
|---------|---------|-------------|
| `force-dynamic` on layout makes ALL child routes serverless | Auth layout had it unnecessarily, causing cold starts on login page | Remove force-dynamic unless layout itself does server-side data fetching |
| Vercel function region defaults to iad1 (Washington DC) | Add `vercel.json` with `"regions": ["bom1"]` for India users | vercel.json at repo root |
| Vercel production branch ≠ default GitHub branch | Vercel picked `master` as production, we use `main` for development | Push to both or change Vercel production branch setting |

---

## Update Rules

1. **ALWAYS update the top block** (ACTIVE GOAL / STATUS / NEXT STEP) - this is the most critical section
2. **On new user request:** Overwrite "Current Objective" entirely
3. **On task completion:** Move to "Recently Completed", update top block
4. **During long tasks:** Update top block after each major step (don't let it go stale mid-work)
5. **On discovery:** Log in "Learning Log"
6. **On context clear:** This file is read FIRST - the top block must be current

---
