# Documentation Index

## Reference Files

| File | Content | When to Load |
|------|---------|-------------|
| `CLAUDE.md` | START sequence, learning loop, communication rules | Auto-loaded |
| `.claude/reference/task_management.md` | Task format, context clear rules | START step 5 |
| `.claude/reference/protected_resources.md` | Protection status | Before modifying resources |
| `.claude/reference/quick_reference.md` | IDs, credentials, constants | When needed |

## Context Persistence Files

| File | Content | When to Update |
|------|---------|----------------|
| `memory/bigger_picture.md` | ACTIVE GOAL, status, what's done/left | On new requests, completions, before context clear |
| `memory/implicit_context.md` | RESUME BRIEF, decisions, failed attempts | During work, before context clear |
| `memory/test_results.md` | Test execution history | After every test run |
| `memory/module_flows.md` | DB relationships, API routes, UI flows, integrations | On every module/DB/API change |

## Skills (auto-loaded via descriptions, full content on invocation)

| Skill | Invocation | Description |
|-------|-----------|-------------|
| `debugging` | Auto or `/debugging` | Error resolution: reproduce → isolate → fix → verify → prevent |
| `testing` | Auto or `/testing` | Test execution, build checks, deployment verification |
| `context-clear` | `/context-clear` only | Pre-clear protocol: commit code, save memory, verify state |
| `_template` | — | Copy to create new skills |

**Each skill has:** `SKILL.md` (frontmatter + patterns) + `reference.md` (detailed examples)

**SKILL.md sections updated by Learning Loop:** Syntax Reference, Core Patterns, Common Pitfalls, Quick Fixes

---
