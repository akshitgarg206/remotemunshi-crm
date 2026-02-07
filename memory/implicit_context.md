# Implicit Context

> **RESUME BRIEF:** Contact Portal built and deployed (Phases 1-3). Applied missing migrations 00020-00025 to Supabase. Portal: magic link auth, 9 read-only API routes, full UI (login, dashboard, client detail with 7 tabs). **IMMEDIATE NEXT:** Test portal end-to-end (create contact with portal_enabled, test magic link flow). Then test employee auth on live deployment. Supabase project ID: `atsemlszcgcojdoqjplt`. IMPORTANT: always push to both `main` AND `master` (`git push origin main && git push origin main:master`).

**Last Updated:** 2026-02-07

---

## Current Session

### Active Work
- **Task:** Contact Portal — Phases 1-3 complete, deployed
- **Approach:** 4-phase: DB+Auth → API routes → UI pages → Filing downloads (future). Phases 1-3 done.
- **Files touched:** supabase/migrations/00025, src/lib/api/portal-handler.ts, src/middleware.ts, src/lib/supabase/middleware.ts, src/lib/validators/contacts.ts, src/app/api/v1/portal/* (11 routes), src/app/portal/* (5 pages)

### Decisions Made (with reasoning)
| Decision | Why | Alternatives Rejected |
|----------|-----|----------------------|
| GitHub + Vercel for deployment | Auto-deploys on push, preview URLs for branches/PRs, better long-term workflow | Vercel CLI-only (requires manual `npx vercel` each time) |
| GitHub repo: `akshitgarg206/remotemunshi-crm` | User's chosen repo name and account | — |
| Force-push main→master for production | Vercel production branch is `master`, CRM code is on `main`, no common ancestor | Change Vercel production branch setting (user would need dashboard access) |
| Mumbai (bom1) function region | Users in India, default iad1 adds 200-300ms latency | — |

### Failed Attempts (DO NOT REPEAT THESE)
| What I Tried | Why It Failed | What To Do Instead |
|-------------|--------------|-------------------|
| Previous sessions wrote entire app (70+ features) but never git committed | Context cleared → all code lost. bigger_picture.md claimed features existed but repo only had 2-file scaffold | ALWAYS commit + push after writing code. Added mandatory rules to CLAUDE.md DURING WORK and BEFORE CONTEXT CLEAR sections |

### Open Questions (need human input)
- No test user account exists in Supabase — user needs to create one or give permission to create via Supabase admin API

---

## Session History

<!-- Before context clear: copy Current Session to here, then write RESUME BRIEF above -->
<!-- Keep last 3 sessions. Delete oldest when adding new. -->

### Session: 2026-02-07
**Work Done:** Fixed Vercel 404 (force-pushed main→master), made login page static, set function region to Mumbai (bom1)
**Key Learnings:** Vercel production branch was `master` not `main`; force-dynamic on auth layout was unnecessary; always push to both branches
**Handoff:** Production live, no test user yet, next step is create test account

---

## Rules

1. **Before context clear:** Write RESUME BRIEF (top), move Current Session to History
2. **After context clear:** Read RESUME BRIEF first, then scan Failed Attempts
3. **During work:** Log decisions and failures as they happen
4. **Failed attempts are the most valuable section** - they prevent wasted effort

---
