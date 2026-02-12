# Implicit Context

> **RESUME BRIEF:** WhatsApp integration DONE — switched to ChakraHQ (not AiSensy). ChakraHQ provides pass-through to Meta Cloud API at `api.chakrahq.com/v1/ext/plugin/whatsapp/{pluginId}/api/v21.0/`. Auth via `CHAKRA_ACCESS_TOKEN` env var. Plugin ID: `fd628b49-97c2-44ce-8fde-e5688503087f`. Phone: `+91 78887 80264`. PENDING: User needs to (1) set env vars on Vercel, (2) get Meta Phone Number ID from ChakraHQ dashboard, (3) add number via Settings > WhatsApp page, (4) configure webhook URL in ChakraHQ. Supabase project ID: `atsemlszcgcojdoqjplt`. IMPORTANT: always push to both `main` AND `master`.

**Last Updated:** 2026-02-12

---

## Current Session

### Active Work
- **Task:** WhatsApp ChakraHQ Integration — CODE COMPLETE, pending env vars + setup
- **Status:** All code updated for ChakraHQ pass-through. Build passes. Committed + pushed. Need user to set Vercel env vars and configure webhook in ChakraHQ.
- **Key files:** src/lib/whatsapp/client.ts (ChakraHQ pass-through), src/app/(app)/settings/whatsapp/page.tsx, src/app/api/v1/webhooks/whatsapp/route.ts, src/app/api/v1/whatsapp/setup/route.ts (new)

### Decisions Made (with reasoning)
| Decision | Why | Alternatives Rejected |
|----------|-----|----------------------|
| ChakraHQ as BSP for coexistence | User needs same number on WhatsApp Business App + Cloud API. ChakraHQ provides pass-through API (same Meta format, different base URL). Originally planned AiSensy, switched to ChakraHQ | AiSensy (meeting didn't work out), Direct Cloud API (no coexistence), Wati (expensive) |
| ChakraHQ pass-through instead of proprietary API | ChakraHQ wraps Meta's Cloud API — same request body format, just proxied through their servers. Minimal code changes needed vs building for proprietary API | Full ChakraHQ native API, Direct Meta Cloud API |
| Auth via env vars instead of per-account DB tokens | Single ChakraHQ account for the whole CRM. Simpler, more secure. access_token field in whatsapp_accounts stores 'chakrahq_env' placeholder | Per-account tokens in DB (old approach for direct Meta API) |
| Native confirm() for delete dialog | Project doesn't have @/components/ui/alert-dialog component | AlertDialog from shadcn/ui |

### Failed Attempts (DO NOT REPEAT THESE)
| What I Tried | Why It Failed | What To Do Instead |
|-------------|--------------|-------------------|
| Previous sessions wrote entire app (70+ features) but never git committed | Context cleared → all code lost | ALWAYS commit + push after writing code |
| Used AlertDialog component in WhatsApp settings page | @/components/ui/alert-dialog doesn't exist in the project | Use native confirm() |
| Embedded Signup SDK with FB.login + config_id | User's Meta app only shows General/Conversions API/Instagram Graph login variations — no "WhatsApp Embedded Signup" option (Tech Provider only) | Use BSP (AiSensy) for coexistence, manual credential entry for settings page |
| Tried to use Cloud API only (Option A) | User needs chat history, groups, and calls — Cloud API doesn't support any of these | Must use coexistence via BSP |

### Open Questions
- What is the Meta Phone Number ID for +91 78887 80264? (User needs to find in ChakraHQ > WhatsApp Setup > Gear icon > Meta ID column)
- Has the webhook URL been configured in ChakraHQ? (ChakraHQ > WhatsApp Setup > More tab > pass-through webhook URL)
- Have Vercel env vars been set? (CHAKRA_PLUGIN_ID, CHAKRA_ACCESS_TOKEN, CHAKRA_REFRESH_TOKEN, WHATSAPP_WEBHOOK_VERIFY_TOKEN)

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
