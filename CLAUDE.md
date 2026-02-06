# MANDATORY: Read this fully. Follow every rule.

## START (before EVERY task)

```
[] 1. Read memory/bigger_picture.md → active goal + status
[] 2. Read memory/implicit_context.md → resume brief + failed attempts
[] 3. Read memory/test_results.md → if STATUS is TESTING or resume brief mentions tests
[] 4. Read memory/module_flows.md → module interlinkages, DB FKs, API routes, UI flows
[] 5. Read .claude/reference/task_management.md → task format + context clear rules
[] 6. Scan user request → match triggers below → load matching guide.md files
[] 7. Update bigger_picture.md top block (ACTIVE GOAL / STATUS / NEXT STEP)
[] 8. TaskCreate (format in task_management.md) → mark in_progress → WORK
```

**Output this checklist with marks before ANY work.**

## DURING WORK

```
→ Hit error/learned syntax/found pattern?
  → Update the relevant protocol guide.md IMMEDIATELY (see Learning Loop below)
→ Need subtask?
  → Loop to step 5 (scan triggers, load protocol, create subtask)
→ Testing?
  → Test → Pass? → Complete | Fail? → Fix → Re-test | Stuck 3x? → Ask user
→ Long task (multi-step)?
  → Update bigger_picture.md top block after each major step (keep it current)
→ Changed modules, DB, API routes, or cross-module integrations?
  → Update memory/module_flows.md IMMEDIATELY (keep it current)
→ Written or modified code files?
  → COMMIT IMMEDIATELY after each working feature/module (git add + git commit)
  → NEVER leave code uncommitted across context clears — uncommitted code is LOST code
  → Push to remote (git push) after every commit batch
→ Done?
  → Mark completed → report result → DELETE task → update bigger_picture.md
```

## BEFORE CONTEXT CLEAR

**Follow the context clear protocol in `.claude/reference/task_management.md`. Do this FIRST if user says "clear context" or context is running low.**

### MANDATORY pre-clear git check
```
1. Run `git status` — if ANY uncommitted changes exist, commit + push them BEFORE clearing
2. Run `git log --oneline -5` — verify recent work is committed
3. Cross-check bigger_picture.md "What's Done" against actual committed files
4. If bigger_picture.md claims work exists but files don't → FLAG to user immediately
```
**WHY:** Previous sessions wrote code but never committed. Context cleared → all code lost. Memory files claimed features existed but the repo only had the initial scaffold. This MUST NOT happen again.

## Communication Rules

- **Be concise.** No preamble ("Let me...", "I'll now..."). Straight to action or answer.
- **Don't narrate tool usage.** Don't say "Let me read the file" - just read it.
- **Don't explain what you're about to do** unless the user asks for a plan.
- **Report results, not process.** Say what changed, not every step you took.
- **Protocol loading is silent.** Never tell the user you're loading protocols.

---

# Project Rules

<!-- CUSTOMIZE: Add your project's stack and domain-specific rules below -->
**Stack:** [YOUR_STACK_HERE]

## Protected Resources

<!-- CUSTOMIZE: List resources that require approval before modification -->
| Resource | ID | Lock |
|----------|-----|------|
| <!-- example: Production API --> | <!-- ID --> | locked |

**locked = Ask approval before editing**

## Critical Rules

<!-- CUSTOMIZE: Add your project's non-negotiable rules -->
1. **Check protection status** before modifying protected resources
2. **Testing** - Verify changes work before marking complete
3. **[Add project-specific rules]**

## Protocol Triggers (single source of truth)

<!-- CUSTOMIZE: Add your protocols. This is the ONLY trigger table - no duplicates elsewhere. -->
| Trigger | Protocol | Path |
|---------|----------|------|
| debug, error, failed, broken | debugging | `.claude/skills/debugging/guide.md` |
| test, verify, validate, check | testing | `.claude/skills/testing/guide.md` |
| <!-- trigger words --> | <!-- name --> | `.claude/skills/{name}/guide.md` |

## Learning Loop (update protocols AS YOU WORK)

When you encounter any of these, update the relevant protocol's `guide.md` **immediately**:

| What happened | Add to section | Example |
|--------------|----------------|---------|
| Syntax that worked | **Syntax Reference** | `datetime.fromisoformat()` not `datetime.strptime()` for ISO dates |
| Syntax that failed | **Common Pitfalls** | f-strings inside f-strings need different quote types |
| Logic pattern that works | **Core Patterns** | Always check `if result is not None` before accessing `.data` |
| Error + its fix | **Quick Fixes** | "column not found" → check if column name is a reserved word |
| Approach that failed | **Common Pitfalls** | Don't retry the same API call on 400 errors — fix the payload |

**Rule:** If you fixed something or learned something, the protocol must be updated before the task is marked complete. Future sessions benefit only if you write it down.

**Size management:** When a guide.md exceeds ~3k tokens, move older/less-common patterns to `reference.md` and keep only the most-used patterns in guide.md.

**No matching protocol?** If you've hit 3+ patterns for a domain with no protocol, create one:
1. Copy `_template/` → `.claude/skills/new-name/`
2. Fill in guide.md with patterns discovered so far
3. Add trigger row to the Protocol Triggers table above

## Quick References

- IDs/credentials: `.claude/reference/quick_reference.md`
- Protected resources: `.claude/reference/protected_resources.md`
- Task format + context clear rules: `.claude/reference/task_management.md`
- Module flows & interlinkages: `memory/module_flows.md` **(update on every module/DB/API change)**

---
