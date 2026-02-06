# Protocol System

**Purpose:** 2-level protocol structure for efficient context loading and accumulated learning

---

## Protocol Structure

### Level 1: Instructions (Loaded on Trigger)
- **File:** `guide.md`
- **Size:** ~2-3k tokens per protocol
- **Contains:** Syntax reference, core patterns, common pitfalls, quick fixes
- **Loaded:** When protocol trigger words detected (triggers defined in CLAUDE.md)

### Level 2: Resources (Loaded as Needed)
- **File:** `reference.md`
- **Size:** Unlimited
- **Contains:** Detailed examples, error catalogs, complete schemas
- **Loaded:** When guide.md patterns are insufficient

---

## How Protocols Work

When user request matches trigger words in CLAUDE.md:
1. Load relevant protocol `guide.md`
2. Use patterns from guide
3. Load `reference.md` only if detailed examples needed

```
User request → match triggers in CLAUDE.md → load guide.md → use patterns →
load reference.md only if guide insufficient
```

---

## Creating New Protocols

**When:** 3+ patterns discovered for a domain with no existing protocol

**Steps:**
1. Copy `_template/` → `.claude/skills/new-name/`
2. Fill in `guide.md` with patterns discovered
3. Add trigger row to Protocol Triggers table in CLAUDE.md

**Structure:**
```
.claude/skills/protocol-name/
  guide.md       (syntax, patterns, pitfalls, fixes)
  reference.md   (detailed examples, catalogs)
```

---

## Learning Loop Integration

As you work, the Learning Loop (defined in CLAUDE.md) updates guide.md files:

| What happened | guide.md section |
|--------------|-----------------|
| Correct syntax found | **Syntax Reference** |
| Working logic pattern | **Core Patterns** |
| Something that didn't work | **Common Pitfalls** |
| Error + solution | **Quick Fixes** |

**Update rules:**
- Be concise — add only the essential pattern/fix
- Be preventive — teach how to avoid errors, not just fix them
- Update immediately — don't batch, don't wait

---

## Maintenance

1. **Load guide when needed** — don't load all protocols at once
2. **Load reference rarely** — only for deep dives
3. **Protocols grow automatically** — Learning Loop adds to them during normal work
4. **No protocol for a domain?** — Create one after discovering 3+ patterns

---
