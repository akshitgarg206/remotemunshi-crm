# Implicit Context

> **RESUME BRIEF:** WhatsApp Business API integration fully implemented and deployed. 13 files created/modified across 6 phases: DB migration 00026 (whatsapp_accounts), Cloud API client, inbound processor + media handler, webhook endpoint (HMAC verified), outbound sending on messages route, delivery receipts, Settings page (Embedded Signup UI), React Query hooks, 3 API routes. Env vars set on Vercel (META_APP_ID, META_APP_SECRET, WHATSAPP_WEBHOOK_VERIFY_TOKEN=remotemunshi_akshit206). Webhook subscribed to `messages` in Meta dashboard. `attachments` storage bucket created in Supabase with RLS. Build fix: replaced missing AlertDialog with confirm(). User still needs to connect WhatsApp numbers via Embedded Signup flow. Supabase project ID: `atsemlszcgcojdoqjplt`. IMPORTANT: always push to both `main` AND `master` (`git push origin main && git push origin main:master`).

**Last Updated:** 2026-02-09

---

## Current Session

### Active Work
- **Task:** WhatsApp Business API Integration — COMPLETE + DEPLOYED
- **Approach:** 6-phase implementation: DB migration, Settings page, Webhook endpoint, Inbound processing, Outbound sending, Delivery receipts
- **Files created:** supabase/migrations/00026_whatsapp_accounts.sql, src/lib/whatsapp/client.ts, src/lib/whatsapp/media.ts, src/lib/whatsapp/process-inbound.ts, src/app/api/v1/webhooks/whatsapp/route.ts, src/app/api/v1/whatsapp/accounts/route.ts, src/app/api/v1/whatsapp/accounts/[id]/route.ts, src/app/api/v1/whatsapp/token-exchange/route.ts, src/hooks/queries/use-whatsapp-accounts.ts, src/app/(app)/settings/whatsapp/page.tsx
- **Files modified:** src/app/(app)/settings/page.tsx (added WhatsApp to Integration group), src/app/api/v1/support/conversations/[id]/messages/route.ts (outbound WhatsApp sending), .env.example (3 new vars)

### Decisions Made (with reasoning)
| Decision | Why | Alternatives Rejected |
|----------|-----|----------------------|
| GitHub + Vercel for deployment | Auto-deploys on push, preview URLs for branches/PRs, better long-term workflow | Vercel CLI-only (requires manual `npx vercel` each time) |
| GitHub repo: `akshitgarg206/remotemunshi-crm` | User's chosen repo name and account | — |
| Force-push main→master for production | Vercel production branch is `master`, CRM code is on `main`, no common ancestor | Change Vercel production branch setting (user would need dashboard access) |
| Mumbai (bom1) function region | Users in India, default iad1 adds 200-300ms latency | — |
| Native confirm() for delete dialog | Project doesn't have @/components/ui/alert-dialog component | AlertDialog from shadcn/ui (would need to add the component) |
| HMAC signature verification via crypto.createHmac | Secure webhook validation per Meta requirements | No verification (insecure) |
| createAdminClient() for webhook processing | Webhook is a public endpoint with no auth session — needs service_role to write to DB | createServerSupabaseClient (requires auth session) |

### Failed Attempts (DO NOT REPEAT THESE)
| What I Tried | Why It Failed | What To Do Instead |
|-------------|--------------|-------------------|
| Previous sessions wrote entire app (70+ features) but never git committed | Context cleared → all code lost. bigger_picture.md claimed features existed but repo only had 2-file scaffold | ALWAYS commit + push after writing code. Added mandatory rules to CLAUDE.md DURING WORK and BEFORE CONTEXT CLEAR sections |
| Used AlertDialog component in WhatsApp settings page | @/components/ui/alert-dialog doesn't exist in the project — build failed on Vercel | Use native confirm() like departments page does |
| User tried to add phone number via Meta Dev Portal "Add Phone Number" | Shows "phone already registered" error — that's the old migration flow | Use Embedded Signup flow instead (CRM's "Connect WhatsApp" button) for coexistence mode |

### Open Questions (need human input)
- User needs to connect WhatsApp numbers via Embedded Signup — coexistence mode may require latest WhatsApp Business App version on phone
- Webhook URL: `https://remotemunshi-crm-akshitgarg206s-projects.vercel.app/api/v1/webhooks/whatsapp`
- Verify token: `remotemunshi_akshit206`

---

## Session History

<!-- Before context clear: copy Current Session to here, then write RESUME BRIEF above -->
<!-- Keep last 3 sessions. Delete oldest when adding new. -->

### Session: 2026-02-10
**Work Done:** WhatsApp Business API integration (6 phases): migration 00026, Cloud API client, inbound processor, webhook endpoint, outbound sending, Settings page. Fixed build error (missing AlertDialog). Created attachments storage bucket. Env vars + webhook configured in Meta dashboard.
**Key Learnings:** Project doesn't have alert-dialog UI component — use native confirm(). Coexistence mode uses Embedded Signup flow not Dev Portal "Add Phone Number". Hard refresh needed after failed→successful Vercel deployments (cached old broken build causes sidebar to show only Dashboard).
**Handoff:** All code deployed. User needs to connect WhatsApp numbers via Embedded Signup.

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
