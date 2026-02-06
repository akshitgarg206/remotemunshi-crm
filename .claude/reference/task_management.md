# Task Management Protocol

> **The task sequence is in CLAUDE.md (START checklist). This doc covers: task format, context clear rules, and status flow.**

---

## Task Structure (must survive context clear)

**Subject:** Specific and actionable
- "Fix connection pool timeout in auth middleware"
- ~~"Fix the bug"~~ (too vague)

**Description must include:**
1. User's exact request (quoted)
2. Success criteria (measurable)
3. Resource IDs/paths (if applicable)
4. Files touched so far (for context recovery)
5. What's been tried already (current state)
6. Next steps (ordered)
7. Protocols loaded (for context recovery)

**ActiveForm:** Present continuous of subject ("Fixing connection pool timeout")

**Example:**
```
User request: "Fix the failing API tests"
Goal: All API tests pass in CI
Resources: tests/api/, src/auth/middleware.py
Files touched: src/auth/middleware.py, tests/api/test_auth.py
Tried: Increased timeout to 30s - didn't help
Protocols: debugging, testing
Steps:
1. Profile test to find actual bottleneck
2. Fix root cause
3. Re-run test suite
4. Verify all pass
```

---

## Context Clear Protocol

### BEFORE clear:
1. Write `implicit_context.md` RESUME BRIEF (2-3 lines: where to pick up, what's left)
2. Move Current Session to Session History
3. Update `bigger_picture.md` top block (ACTIVE GOAL / STATUS / NEXT STEP)
4. Log test results to `test_results.md` if any tests were run
5. Ensure active task descriptions are self-contained

### AFTER clear (recovery):
1. CLAUDE.md auto-loads → follow START checklist
2. START steps 1-3 read bigger_picture + implicit_context + test_results (if testing)
3. `TaskList()` → `TaskGet(id)` → resume from description

---

## Status Flow

`pending` → `in_progress` → `completed` → DELETE (frees ~200-500 tokens)

**Never mark completed without verification. Never skip DELETE.**

---
