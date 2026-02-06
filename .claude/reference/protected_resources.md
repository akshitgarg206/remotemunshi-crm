# Protected Resources

**Purpose:** Track resources that require explicit approval before modification

**Last Updated:** <!-- auto-update timestamp -->

---

## Protection Levels

| Level | Meaning | Action Required |
|-------|---------|----------------|
| LOCKED | No modifications without explicit approval | Ask user before ANY change |
| CHECKPOINT | Specific sections locked after verification | Ask before changing locked sections |
| UNLOCKED | Free to modify | Proceed normally |

---

## Protected Resources

<!-- CUSTOMIZE: Add your project's protected resources -->
<!-- Examples: production configs, verified workflows, stable APIs, deployed services -->

| Resource | ID/Path | Protection | Reason | Locked Date |
|----------|---------|------------|--------|-------------|
| <!-- Example: Production DB config --> | <!-- path/id --> | LOCKED | <!-- Verified working --> | <!-- date --> |

---

## Checkpoint Locks

<!-- For resources with granular section-level protection -->

### [Resource Name]

| Section | Status | Verified Date | Notes |
|---------|--------|---------------|-------|
| | | | |

---

## Approval Process

1. **Check this file** for protection status of any resource you're about to modify
2. **If LOCKED:** Inform user and request explicit approval before proceeding
3. **If CHECKPOINT:** Check which sections are locked, request approval for those
4. **If UNLOCKED:** Proceed normally
5. **After approved changes:** Update this file with new status

## Locking a Resource

When a resource has been verified working:
1. Add it to the table above with LOCKED status
2. Document what was verified and when
3. Require explicit user approval for future changes

## Unlocking a Resource

Only unlock when:
- User explicitly requests it
- Resource needs modification for a new feature
- Update this file to reflect new status

---
