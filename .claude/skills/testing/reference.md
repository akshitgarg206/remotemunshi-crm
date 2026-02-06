# Testing - Reference

**Purpose:** Detailed test patterns, strategies, and historical test data

**Load when:** Guide patterns are insufficient, or you need specific test strategies

---

## Test Strategies

### Smoke Test
**When:** After any change, verify basic functionality works
**How:** Run the simplest happy-path scenario
**Duration:** Quick (< 1 minute)

### Regression Test
**When:** After fixing a bug, ensure nothing else broke
**How:** Run existing test suite focused on the changed module
**Duration:** Medium (1-5 minutes)

### Integration Test
**When:** Testing how components work together
**How:** End-to-end flow with real (or realistic) data
**Duration:** Long (5+ minutes)

### Edge Case Test
**When:** After core functionality verified
**How:** Test boundaries, nulls, empty inputs, large inputs, special characters
**Duration:** Varies

---

## Test Data Patterns

### Minimal Reproducible Test
- Use the smallest possible input that exercises the code path
- Reduces noise in debugging when tests fail
- Faster to iterate on

### Boundary Testing
- Empty input
- Single item
- Maximum allowed input
- Just over maximum (should fail gracefully)
- Special characters and encoding

---

## Historical Test Results

<!-- Auto-populated as tests are run and logged -->
<!-- Use this to track patterns in what fails and why -->

| Date | Test | Result | Root Cause (if failed) |
|------|------|--------|----------------------|
| | | | |

---

## Timing Guidelines

<!-- CUSTOMIZE: Add project-specific timing for operations -->
| Operation | Expected Duration | Timeout |
|-----------|-------------------|---------|
| Unit tests | < 30 seconds | 60 seconds |
| Integration tests | 1-5 minutes | 10 minutes |
| End-to-end tests | 5-15 minutes | 20 minutes |

---
