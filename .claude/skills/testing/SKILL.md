---
name: testing
description: Test execution and verification. Use when testing changes, verifying behavior, running builds, validating deployments, or checking correctness. Includes pre-push build checks and post-push smoke tests.
---

# Testing

Systematic approach to testing changes and verifying correct behavior.

## Syntax Reference

<!-- LEARNING LOOP TARGET: Add correct test syntax/commands as you discover them -->
| Context | Correct Syntax |
|---------|---------------|
| Build check before push | `npm run prebuild:check` |
| Full build | `npm run build` |
| Lint only | `npm run lint` |

---

## Testing Methodology

### Step 1: Prerequisites Check
- [ ] Understand what "success" looks like (define expected outcome)
- [ ] Identify what to test (specific function, endpoint, workflow, etc.)
- [ ] Ensure test environment is ready
- [ ] Record baseline state (before test)

### Step 2: Execute Test
- Record start time / baseline timestamp
- Run the test with clear inputs
- Capture all output (stdout, stderr, return values, side effects)
- Note duration

### Step 3: Verify Results
- Compare actual output vs expected output
- Check for side effects (database changes, file modifications, etc.)
- Verify no regressions in related functionality
- Record results in `memory/test_results.md`

### Step 4: Handle Results

**On SUCCESS:** Mark passed → Log in test_results.md → Complete task

**On FAILURE:** Log failure → Switch to `/debugging` skill → Fix → RE-TEST (loop)

**On STUCK (3 failures):** Stop → Document what you've tried → Ask user

---

## Pre-Push Build Check (MANDATORY)

**Why:** `next dev` does NOT catch prerender errors. Only `next build` catches them.

**Rule:** Always run `npm run build` before pushing. If it fails, fix before push.

**What it catches:**
- TypeScript errors across all files (not just open ones)
- Static prerender failures (env vars, server-only APIs called during SSG)
- Missing imports / broken module resolution
- Invalid page exports

**Known pattern:** Pages under `(app)/` use `force-dynamic` because all app pages require Supabase auth. New layouts without `export const dynamic = 'force-dynamic'` will fail prerender on Vercel.

---

## Post-Push Runtime Smoke Test (MANDATORY)

**Why:** `npm run build` catches compile-time errors but NOT runtime errors like middleware crashes or edge runtime incompatibilities.

**After every push, verify the live deployment:**
```bash
# Hit login page — should return 200
curl -s -o /dev/null -w "%{http_code}" https://YOUR_APP.vercel.app/login

# Hit protected route — should redirect (302), not crash (500)
curl -s -o /dev/null -w "%{http_code}" https://YOUR_APP.vercel.app/dashboard

# Hit API route — should return 401, not 500
curl -s -o /dev/null -w "%{http_code}" https://YOUR_APP.vercel.app/api/v1/auth/me
```

---

## Common Pitfalls

<!-- LEARNING LOOP TARGET: Add things that DON'T work here -->
| Pitfall | Wrong | Right |
|---------|-------|-------|
| No baseline | "I think it was working before" | Record state before changes |
| Incomplete verification | "The main test passes" | Check edge cases and side effects |
| No logging | "I remember what happened" | Write results to test_results.md |
| Skipping re-test | "The fix should work" | Always re-run the failing test |
| Testing too much at once | Run all tests blindly | Focus on the changed area first |
| Skipping build before push | "It works in dev" | Run `npm run build` — dev skips prerender |
| Static page with Supabase | Page prerenders without env vars | Add `force-dynamic` to layout |
| Using middleware.ts on Next.js 16 | MIDDLEWARE_INVOCATION_FAILED on Vercel | Use server-side auth check in layout |
| Only testing build, not runtime | "Build passed so it works" | Also run smoke test curls after deploy |

---

## Test Result Logging

**Always log in `memory/test_results.md` with this format:**

```markdown
## Test Run: [Description] - [ISO Timestamp]

**Context:** [What was tested and why]
**Status:** SUCCESS / FAILED / PARTIAL
**Duration:** [time]

### Results
- [findings]

### Issues Found
| Issue | Severity | Status |
|-------|----------|--------|

### Next Actions
- [ ] [follow-up]
```

---

## Cross-References

- **Debugging skill:** `.claude/skills/debugging/SKILL.md`
- **Test results log:** `memory/test_results.md`
- **Detailed strategies:** [reference.md](reference.md)
