# Testing - Guide

**Purpose:** Systematic approach to testing changes and verifying correct behavior

---

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
Before running any test:
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

**On SUCCESS:**
```
-> Mark test as passed
-> Log results in test_results.md
-> Complete the task
```

**On FAILURE:**
```
-> Log failure details in test_results.md
-> Switch to debugging protocol
-> Fix the issue
-> RE-TEST (loop back to Step 1)
```

**On STUCK (3 failures):**
```
-> Stop testing
-> Document what you've tried
-> Ask user for guidance
```

---

## Test-Debug-Test Loop

```
Test -> Check Results -> PASS? -> Done
                      -> FAIL? -> Debug -> Fix -> Re-Test (LOOP)
                      -> STUCK 3x? -> Ask Human
```

**Critical rule:** NEVER mark a task as complete without a passing test that verifies the change.

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

## Pre-Push Build Check (MANDATORY)

**Why:** `next dev` does NOT catch prerender errors. Only `next build` catches them. Previous deploys failed on Vercel because static pages tried to access env vars (Supabase URL) at build time.

**Rule:** Always run `npm run build` before pushing. If it fails, fix before push.

```bash
# Before every git push:
npm run build
# If it passes → safe to push
# If it fails → fix the error first
```

**What it catches:**
- TypeScript errors across all files (not just open ones)
- Static prerender failures (env vars, server-only APIs called during SSG)
- Missing imports / broken module resolution
- Invalid page exports

**Known pattern:** Any page under `(app)/` uses `force-dynamic` because all app pages require Supabase auth. If a new layout or page group is added without `export const dynamic = 'force-dynamic'`, prerender will fail on Vercel where env vars aren't available at build time.

---

## Post-Push Runtime Smoke Test (MANDATORY)

**Why:** `npm run build` catches compile-time errors but NOT runtime errors like middleware crashes, edge runtime incompatibilities, or server component failures that only surface on Vercel's infrastructure.

**After every push, verify the live deployment:**

```bash
# 1. Wait for Vercel deploy to finish (check dashboard or `vercel ls`)

# 2. Hit the login page — should render without 500
curl -s -o /dev/null -w "%{http_code}" https://YOUR_APP.vercel.app/login
# Expected: 200

# 3. Hit a protected route — should redirect to /login (302) not crash (500)
curl -s -o /dev/null -w "%{http_code}" https://YOUR_APP.vercel.app/dashboard
# Expected: 302 (redirect to login)

# 4. Hit an API route — should return 401 not 500
curl -s -o /dev/null -w "%{http_code}" https://YOUR_APP.vercel.app/api/v1/auth/me
# Expected: 401
```

**What it catches that `npm run build` does NOT:**
- Middleware/proxy runtime failures (MIDDLEWARE_INVOCATION_FAILED)
- Edge runtime incompatibilities (Node APIs used in edge context)
- Missing env vars at runtime (build can pass with `force-dynamic` but runtime still needs them)
- Supabase connection failures (wrong URL/key, network policies)
- Server component errors that only trigger on real requests

**Known patterns:**
- Next.js 16 deprecated `middleware.ts` → use server-side auth in layouts instead. Middleware causes `MIDDLEWARE_INVOCATION_FAILED` on Vercel edge runtime.
- Auth guard lives in `src/app/(app)/layout.tsx` — server-side `supabase.auth.getUser()` + `redirect('/login')`.
- Do NOT use `src/middleware.ts` — it was deleted for this reason.

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
| Skipping build check before push | "It works in dev" | Run `npm run build` — dev mode skips prerender |
| Static page with Supabase client | Page prerenders without env vars | Add `export const dynamic = 'force-dynamic'` to layout |
| Using middleware.ts on Next.js 16 | MIDDLEWARE_INVOCATION_FAILED on Vercel | Use server-side auth check in layout instead |
| Only testing build, not runtime | "Build passed so it works" | Also run smoke test curl commands after deploy |

---

## Testing Checklist

- [ ] Success criteria defined before testing
- [ ] Baseline state recorded
- [ ] Test executed with clear inputs
- [ ] All outputs captured
- [ ] Results compared to expectations
- [ ] Side effects checked
- [ ] Results logged to test_results.md
- [ ] No regressions confirmed
- [ ] Task updated with outcome

---

## Cross-References

- **Debugging protocol:** `.claude/skills/debugging/guide.md`
- **Test results log:** `memory/test_results.md`
- **Protected resources:** `.claude/reference/protected_resources.md`

---
