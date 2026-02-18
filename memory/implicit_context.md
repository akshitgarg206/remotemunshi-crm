# Implicit Context

> **RESUME BRIEF:** Leads Module Enhancement (8 phases) COMPLETE. All code committed + pushed to main AND master. Build passes cleanly. Migrations 00031-00033 applied to Supabase (project: atsemlszcgcojdoqjplt). Fixed 2 build errors during testing: CsvImporter uses `onComplete` not `onImport`, and `{val && str}` pattern in JSX causes ReactNode type error (use ternary instead). PENDING: User needs to configure env vars on Vercel for Outlook (MICROSOFT_CLIENT_ID/SECRET/TENANT_ID/REDIRECT_URI) and Reddit (REDDIT_CLIENT_ID/SECRET/REDIRECT_URI) OAuth + INTEGRATION_ENCRYPTION_KEY for token encryption. IMPORTANT: always push to both `main` AND `master`.

**Last Updated:** 2026-02-18

---

## Current Session

### Active Work
- **Task:** Leads Module Enhancement — 8 phases — COMPLETE + DEPLOYED + BUILD VERIFIED
- **Status:** All code committed + pushed to both main and master. Build passes. 2 type errors caught and fixed during build testing.
- **Key deliverables:**
  - 3 migrations (00031-00033) — lead enhancements, lead_communications, integration_connections + lead_import_log
  - Lead stages settings API (CRUD at /api/v1/settings/lead-stages)
  - Enhanced lead add form (2-column, all new fields)
  - Rewritten lead detail page (3 tabs: Overview/Activity/Communications + edit dialog)
  - Lead pipeline kanban board (dynamic columns, dnd-kit, optimistic moves)
  - List/Board toggle + filter pills on leads list page
  - WhatsApp convert-to-lead API + button in OmniDesk
  - Outlook integration (7 API routes, OAuth + Graph API, contacts/emails/meetings import, settings page)
  - Reddit integration (8 API routes, OAuth, posts/comments/messages import, settings page)
  - LinkedIn CSV import (template mapping, field transform in import route, settings page)
  - Settings hub updated with Outlook, LinkedIn, Reddit entries

### Decisions Made (with reasoning)
| Decision | Why | Alternatives Rejected |
|----------|-----|----------------------|
| AES-256-GCM for OAuth tokens | Industry standard for at-rest encryption of secrets | Plain text storage, base64 |
| Auto-refresh tokens in client.ts | Transparent to API routes, prevents expired token errors | Manual refresh in each route |
| LinkedIn CSV import (not API) | LinkedIn API requires partner approval. CSV export is available to all users | Wait for API approval |
| Reddit: own posts only | User requested capturing engagement on their own posts, not subreddit monitoring | Subreddit scraping |
| Dynamic kanban columns from lead_stages | Stages are configurable via settings — can't hardcode | Hardcoded pipeline stages |

### Failed Attempts (DO NOT REPEAT THESE)
| What I Tried | Why It Failed | What To Do Instead |
|-------------|--------------|-------------------|
| `z.record(z.unknown())` in Zod validator | This Zod version requires 2 args: `z.record(z.string(), z.unknown())` | Always use 2-arg form for z.record |
| Previous sessions wrote entire app but never git committed | Context cleared → all code lost | ALWAYS commit + push after writing code |
| Used AlertDialog component | @/components/ui/alert-dialog doesn't exist | Use native confirm() |
| CsvImporter `onImport` prop | Prop doesn't exist — component uses `onComplete` | Use `onComplete` callback |
| `{val && str}` in JSX for conditional rendering | TypeScript strict: `unknown && string` → type `unknown` not assignable to ReactNode | Use ternary: `{val ? str : ''}` |

### Open Questions
- Has user configured Outlook OAuth env vars on Vercel?
- Has user configured Reddit OAuth env vars on Vercel?
- Has INTEGRATION_ENCRYPTION_KEY been generated and set?

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
