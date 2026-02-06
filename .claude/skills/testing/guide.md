# Testing - Guide

**Purpose:** Systematic approach to testing changes and verifying correct behavior

---

## Syntax Reference

<!-- LEARNING LOOP TARGET: Add correct test syntax/commands as you discover them -->
| Context | Correct Syntax |
|---------|---------------|
| | |

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

## Common Pitfalls

<!-- LEARNING LOOP TARGET: Add things that DON'T work here -->
| Pitfall | Wrong | Right |
|---------|-------|-------|
| No baseline | "I think it was working before" | Record state before changes |
| Incomplete verification | "The main test passes" | Check edge cases and side effects |
| No logging | "I remember what happened" | Write results to test_results.md |
| Skipping re-test | "The fix should work" | Always re-run the failing test |
| Testing too much at once | Run all tests blindly | Focus on the changed area first |

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
