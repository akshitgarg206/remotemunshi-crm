# Skills System

Skills use Claude Code's native skill format for on-demand loading and auto-invocation.

## How It Works

1. **Descriptions loaded at session start** (~30-50 tokens each) — Claude knows what's available
2. **Full SKILL.md loaded on invocation** — when Claude determines it's relevant, or when you type `/skill-name`
3. **reference.md loaded on demand** — only when SKILL.md patterns are insufficient

## Skill Structure

```
.claude/skills/skill-name/
  SKILL.md         # Required: YAML frontmatter + instructions (keep under ~3k tokens)
  reference.md     # Optional: detailed examples, error catalogs, schemas
```

### SKILL.md Format

```yaml
---
name: skill-name
description: When to use this skill. Include keywords for auto-detection.
# user-invocable: true            # Can user invoke with /skill-name?
# disable-model-invocation: true  # Prevent Claude from auto-invoking?
# allowed-tools: Read, Grep       # Restrict tools available to skill
# context: fork                   # Run in isolated subagent context
# agent: Explore                  # Subagent type (with context: fork)
# argument-hint: [args]           # Shown in autocomplete
---

# Skill content (markdown)
```

### Variables Available in SKILL.md

```
$ARGUMENTS          # All args passed to /skill-name
$ARGUMENTS[0], $0   # First argument
$ARGUMENTS[1], $1   # Second argument
${CLAUDE_SESSION_ID} # Current session ID
!`command`           # Shell output injected before Claude sees it
```

## Creating New Skills

**When:** 3+ patterns discovered for a domain with no existing skill.

1. Copy `_template/` → `.claude/skills/new-name/`
2. Edit `SKILL.md`: set `name`, `description`, fill patterns
3. Learning Loop (in CLAUDE.md) will accumulate patterns over time

## Learning Loop Integration

As you work, update skill SKILL.md files:

| What happened | SKILL.md section |
|--------------|-----------------|
| Correct syntax found | **Syntax Reference** |
| Working logic pattern | **Core Patterns** |
| Something that didn't work | **Common Pitfalls** |
| Error + solution | **Quick Fixes** |

**Size management:** When SKILL.md exceeds ~3k tokens, move older patterns to `reference.md`.

---
