---
name: context-clear
description: Prepare for context clear by committing code, saving state to memory files, and verifying nothing is lost.
disable-model-invocation: true
user-invocable: true
---

# Context Clear Protocol

Execute these steps IN ORDER before clearing context.

## Step 1: Git Safety Check

```
1. Run `git status` — if ANY uncommitted changes exist:
   → git add <files>
   → git commit -m "descriptive message"
   → git push
2. Run `git log --oneline -5` — verify recent work is committed
3. Cross-check bigger_picture.md "What's Done" against actual committed files
4. If bigger_picture.md claims work exists but files don't → FLAG to user immediately
```

**WHY:** Previous sessions wrote code but never committed. Context cleared → all code lost.

## Step 2: Update Memory Files

### implicit_context.md
1. Write RESUME BRIEF (2-3 lines: where to pick up, what's left, what to watch out for)
2. Update Current Session → Active Work, Decisions Made, Failed Attempts
3. Move Current Session to Session History (keep last 3 sessions)

### bigger_picture.md
1. Update top block: ACTIVE GOAL / STATUS / NEXT STEP / Last Updated
2. Move completed items from "What's Left" to "What's Done"
3. Update "Recently Completed" table
4. Add any new learnings to Learning Log

### module_flows.md
1. If any DB/API/UI changes were made this session, ensure they're documented
2. Update cross-module integration points if changed

### test_results.md
1. If any tests were run this session, ensure results are logged

## Step 3: Verify Task Descriptions

1. `TaskList()` — check all active tasks
2. Ensure each task description is self-contained (can be understood without conversation context)
3. Include: files touched, what's tried, next steps

## Step 4: Final Verification

1. Confirm all code is committed and pushed
2. Confirm all memory files are updated
3. Report summary to user: what was done, what's next

**Context is now safe to clear.**
