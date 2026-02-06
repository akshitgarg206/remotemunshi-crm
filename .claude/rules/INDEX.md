# Documentation Index

> **Protocol triggers are in CLAUDE.md only (single source of truth). Don't duplicate them here.**

## Reference Files

| File | Content | When to Load |
|------|---------|-------------|
| `CLAUDE.md` | Sequence, triggers, learning loop, communication rules | Auto-loaded |
| `.claude/reference/task_management.md` | Task format, context clear rules | START step 3 |
| `.claude/reference/protected_resources.md` | Protection status | Before modifying resources |
| `.claude/reference/quick_reference.md` | IDs, credentials, constants | When needed |

## Context Persistence Files

| File | Content | When to Update |
|------|---------|----------------|
| `memory/bigger_picture.md` | ACTIVE GOAL, status, what's done/left | On new requests, completions, before context clear |
| `memory/implicit_context.md` | RESUME BRIEF, decisions, failed attempts | During work, before context clear |
| `memory/test_results.md` | Test execution history | After every test run |

## Protocol Skills

| Directory | Purpose |
|-----------|---------|
| `.claude/skills/_template/` | Copy to create new protocols |
| `.claude/skills/debugging/` | Error resolution methodology |
| `.claude/skills/testing/` | Test execution and verification |

**Each protocol has:** `guide.md` (patterns, syntax, pitfalls) + `reference.md` (detailed examples)

**Guide.md sections updated by Learning Loop:** Syntax Reference, Core Patterns, Common Pitfalls, Quick Fixes

---
