# Debugging - Guide

**Purpose:** Systematic approach to finding and fixing errors in any project

---

## Syntax Reference

<!-- LEARNING LOOP TARGET: Add correct syntax patterns as you discover them -->
| Context | Correct Syntax |
|---------|---------------|
| | |

---

## Methodology: Checkpoint-Based Debugging

### Step 1: Reproduce
- Confirm the error exists and is reproducible
- Capture exact error message, stack trace, and context
- Note what was working before (if known)

### Step 2: Isolate
- Identify the boundary between "works" and "doesn't work"
- Use binary search: test at midpoints to narrow down the failure point
- Check recent changes that could have introduced the issue

### Step 3: Identify Root Cause
- Read the actual code at the failure point
- Check inputs vs expected inputs
- Look for: type mismatches, null/undefined, missing dependencies, configuration drift

### Step 4: Fix
- Make the minimal change that fixes the issue
- Don't refactor while debugging - fix the bug only
- Verify the fix addresses the root cause, not just the symptom

### Step 5: Verify
- Re-run the original failing scenario
- Run related tests to catch regressions
- Document what was wrong and why

### Step 6: Prevent
- Update the relevant protocol with the pattern to PREVENT this error
- Log in `memory/test_results.md` with fix details
- Add to error catalog in `reference.md` if it's a new error type

---

## Common Pitfalls

<!-- LEARNING LOOP TARGET: Add things that DON'T work here -->
| Pitfall | Wrong | Right |
|---------|-------|-------|
| Fixing symptoms | Suppress the error message | Fix the root cause |
| Shotgun debugging | Change 5 things at once | Change 1 thing, verify, repeat |
| Missing context | Jump to code immediately | Read error message fully first |
| No verification | "It should work now" | Run the test that was failing |
| No documentation | Fix and move on | Log the fix and update protocols |

---

## Quick Fixes

<!-- LEARNING LOOP TARGET: Add error→solution pairs here -->
| Error/Problem | Fix |
|--------------|-----|
| "Not found" errors | Check paths, IDs, and spelling |
| "Undefined" errors | Check data flow - is the value being passed? |
| "Permission" errors | Check credentials and access configuration |
| "Timeout" errors | Check if the service is running and reachable |
| "Type" errors | Check input types vs expected types |
| "Syntax" errors | Check for missing brackets, quotes, semicolons |
| Intermittent failures | Check race conditions, timing, external dependencies |

---

## Debugging Checklist

- [ ] Error message captured completely
- [ ] Error is reproducible
- [ ] Scope narrowed (which component/file/function)
- [ ] Root cause identified (not just symptom)
- [ ] Minimal fix applied
- [ ] Original failing scenario passes
- [ ] No regressions introduced
- [ ] Fix documented in test_results.md
- [ ] Protocol updated to prevent recurrence

---

## When Stuck (3x Rule)

If the same fix attempt fails 3 times:
1. Stop and reassess the approach
2. Check if your assumption about the root cause is wrong
3. Look at the problem from a different angle
4. Ask the user for guidance

**Never brute-force the same approach repeatedly.**

---

## Cross-References

- **Testing protocol:** `.claude/skills/testing/guide.md`
- **Error catalog:** `.claude/skills/debugging/reference.md`
- **Test results log:** `memory/test_results.md`

---
