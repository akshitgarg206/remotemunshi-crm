# Implicit Context

> **RESUME BRIEF:** YCloud added as second WhatsApp provider alongside ChakraHQ. Multi-provider dispatch in client.ts based on `whatsapp_accounts.metadata.provider`. YCloud webhook handles all 17 events at `/api/v1/webhooks/ycloud`. Env vars set on Vercel: `YCLOUD_API_KEY=7c224a0d8eb52ccee55df123757c4cc5`, `YCLOUD_WEBHOOK_SECRET=whsec_587fd7434826460c88e6602f304ea18d`. OmniDesk "New Conversation" dialog now has WhatsApp number selector. PENDING: User needs to add YCloud number in Settings > WhatsApp, configure webhook URL in YCloud dashboard, test inbound/outbound. Supabase project ID: `atsemlszcgcojdoqjplt`. IMPORTANT: always push to both `main` AND `master`.

**Last Updated:** 2026-02-12

---

## Current Session

### Active Work
- **Task:** YCloud WhatsApp provider integration — COMPLETE + DEPLOYED
- **Status:** All code committed + pushed + deployed to Vercel. Env vars set. Pending: user setup (add number, configure webhook in YCloud dashboard, test).
- **Key files changed:**
  - `src/lib/whatsapp/client.ts` — YCloud send functions + `getProviderForPhoneNumberId()` + unified dispatch
  - `src/lib/whatsapp/media.ts` — provider-aware media download
  - `src/lib/whatsapp/process-inbound.ts` — provider param + `_ycloud_link` pass-through
  - `src/app/api/v1/webhooks/ycloud/route.ts` — NEW: all 17 YCloud event types
  - `src/app/api/v1/support/conversations/[id]/messages/route.ts` — provider-aware outbound
  - `src/app/api/v1/whatsapp/accounts/route.ts` — accepts `provider` field
  - `src/app/api/v1/whatsapp/setup/route.ts` — per-provider status
  - `src/app/(app)/settings/whatsapp/page.tsx` — provider dropdown, badges, dual webhook URLs
  - `src/app/(app)/support/page.tsx` — WhatsApp number selector in New Conversation dialog
  - `src/lib/validators/support-conversations.ts` — metadata field added
  - `src/hooks/queries/use-whatsapp-accounts.ts` — provider in mutation + setup types

### Decisions Made (with reasoning)
| Decision | Why | Alternatives Rejected |
|----------|-----|----------------------|
| Simple if/else provider dispatch | Only 2 providers (ChakraHQ + YCloud). No need for abstract class hierarchy | Factory pattern, plugin system |
| `metadata.provider` field on whatsapp_accounts | Existing JSONB column, no migration needed | New DB column, separate provider table |
| Separate webhook endpoints per provider | Different payload formats, different signature verification. Clean separation | Single endpoint with provider detection |
| YCloud `from` field = display_phone_number (E.164) | YCloud API requires `from` in E.164 format, no Meta-style phone_number_id | N/A |
| Map YCloud payloads to Meta format | Reuse existing `processInboundMessage` / `processStatusUpdate` without duplication | Separate processing pipeline |

### Failed Attempts (DO NOT REPEAT THESE)
| What I Tried | Why It Failed | What To Do Instead |
|-------------|--------------|-------------------|
| `z.record(z.unknown())` in Zod validator | This Zod version requires 2 args: `z.record(z.string(), z.unknown())` | Always use 2-arg form for z.record |
| Previous sessions wrote entire app but never git committed | Context cleared → all code lost | ALWAYS commit + push after writing code |
| Used AlertDialog component | @/components/ui/alert-dialog doesn't exist | Use native confirm() |

### Open Questions
- Has user added YCloud number in Settings > WhatsApp yet?
- Has webhook URL been configured in YCloud dashboard?
- Has test inbound/outbound been verified?

---

## Session History

### Session: 2026-02-12 (earlier)
**Work Done:** WhatsApp ChakraHQ integration — switched from direct Meta Cloud API to ChakraHQ pass-through. Chat history sync from ChakraHQ. Debug logging for outbound send flow.
**Key Learnings:** ChakraHQ wraps Meta API with same request format. ChakraHQ returns `{ _data: { whatsappMessageId } }` wrapper. Vercel kills serverless functions after response — must await processing.
**Handoff:** ChakraHQ integration working. User setting up env vars.

### Session: 2026-02-10
**Work Done:** WhatsApp Business API integration (6 phases): migration 00026, Cloud API client, inbound processor, webhook endpoint, outbound sending, Settings page.
**Key Learnings:** Project doesn't have alert-dialog UI component — use native confirm(). Hard refresh needed after failed→successful Vercel deployments.
**Handoff:** All code deployed. User needs to connect WhatsApp numbers.

### Session: 2026-02-07
**Work Done:** Fixed Vercel 404 (force-pushed main→master), made login page static, set function region to Mumbai (bom1)
**Key Learnings:** Vercel production branch was `master` not `main`; always push to both branches
**Handoff:** Production live, next step create test account

---

## Rules

1. **Before context clear:** Write RESUME BRIEF (top), move Current Session to History
2. **After context clear:** Read RESUME BRIEF first, then scan Failed Attempts
3. **During work:** Log decisions and failures as they happen
4. **Failed attempts are the most valuable section** - they prevent wasted effort

---
