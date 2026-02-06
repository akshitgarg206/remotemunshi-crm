-- Migration: Optional Two-Level Task Review System
-- Adds reviewer columns to tasks for hierarchical review workflow

-- ============================================================================
-- 1. ALTER TABLE tasks — add review columns
-- ============================================================================

ALTER TABLE tasks
  ADD COLUMN reviewer_1_id UUID REFERENCES employees(id),
  ADD COLUMN reviewer_2_id UUID REFERENCES employees(id),
  ADD COLUMN current_review_level INTEGER DEFAULT 0 CHECK (current_review_level IN (0, 1, 2)),
  ADD COLUMN review_1_status TEXT CHECK (review_1_status IN ('pending', 'approved', 'changes_requested')),
  ADD COLUMN review_2_status TEXT CHECK (review_2_status IN ('pending', 'approved', 'changes_requested')),
  ADD COLUMN review_1_at TIMESTAMPTZ,
  ADD COLUMN review_2_at TIMESTAMPTZ,
  ADD COLUMN review_1_comment TEXT,
  ADD COLUMN review_2_comment TEXT;

-- ============================================================================
-- 2. Indexes for reviewer queues
-- ============================================================================

CREATE INDEX idx_tasks_reviewer_1 ON tasks(reviewer_1_id)
  WHERE deleted_at IS NULL AND reviewer_1_id IS NOT NULL;

CREATE INDEX idx_tasks_reviewer_2 ON tasks(reviewer_2_id)
  WHERE deleted_at IS NULL AND reviewer_2_id IS NOT NULL;
