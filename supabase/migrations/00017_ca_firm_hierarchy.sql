-- ============================================================================
-- Remote Munshi CRM — Migration 00017: CA Firm User Hierarchy
-- ============================================================================

-- 1. Add permission_level to roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS permission_level INTEGER DEFAULT 0;

-- 2. Add scope to role_permissions (controls data visibility)
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'all'
  CHECK (scope IN ('all', 'department', 'team', 'assigned', 'own'));

-- ============================================================================
-- UPDATE ROLES — CA firm hierarchy
-- ============================================================================

-- Reassign employees on old roles to Super Admin before deleting
UPDATE employees SET role_id = (SELECT id FROM roles WHERE name = 'Super Admin')
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('Admin', 'Manager', 'Senior Associate', 'Associate', 'Intern'));

-- Delete old generic roles (except Super Admin which has permissions wired)
DELETE FROM role_permissions WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('Admin', 'Manager', 'Senior Associate', 'Associate', 'Intern')
);
DELETE FROM roles WHERE name IN ('Admin', 'Manager', 'Senior Associate', 'Associate', 'Intern');

-- Update Super Admin
UPDATE roles SET permission_level = 10, description = 'Full system access — Managing Partner level' WHERE name = 'Super Admin';

-- Insert CA firm roles
INSERT INTO roles (name, description, is_system, permission_level) VALUES
  ('Managing Partner', 'Firm-wide full access, strategic decisions, P&L ownership', true, 10),
  ('Partner', 'Practice area leadership, full CRUD + export on operational modules', false, 9),
  ('Director', 'Functional leadership (support depts), department-wide access', false, 8),
  ('Senior Manager', 'Multi-team oversight, approve tasks, manage resources', false, 7),
  ('Manager', 'Lead client engagements, assign tasks, review work', false, 6),
  ('Assistant Manager', 'Support managers, lead small engagements, limited approval', false, 5),
  ('Team Lead', 'Task coordination, first-level review, mentor juniors', false, 4),
  ('Senior Associate', 'Handle complex work independently, train juniors', false, 3),
  ('Associate', 'Execute deliverables under supervision, needs review', false, 2),
  ('Junior Associate', 'Data entry, documentation, learning under supervision', false, 1),
  ('Article Assistant', 'Articleship/internship, read-only, work under supervision', false, 0),
  ('Executive', 'Support dept operations (HR, IT, Content Marketing, Admin)', false, 3),
  ('Assistant', 'Administrative support, scheduling, basic operations', false, 1)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permission_level = EXCLUDED.permission_level;

-- ============================================================================
-- UPDATE DEPARTMENTS — CA firm departments
-- ============================================================================

-- Update existing + add new
INSERT INTO departments (name, description) VALUES
  ('Accounts', 'Accounting & bookkeeping services'),
  ('Audit', 'Statutory, internal & tax audit services'),
  ('Taxation', 'Direct & indirect tax services'),
  ('Corporate Law', 'Company law, MCA filings, incorporations'),
  ('Compliance', 'Regulatory compliance & filings'),
  ('Payroll', 'Payroll processing, PF/ESI'),
  ('Admin', 'Office administration & operations'),
  ('Content Marketing', 'Content creation, social media, brand management'),
  ('HR', 'Human resources, recruitment, employee management'),
  ('IT', 'Information technology, systems & infrastructure'),
  ('Advisory', 'Business advisory & consulting services'),
  ('Quality & Risk', 'Quality control, risk management, internal standards')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ============================================================================
-- UPDATE DESIGNATIONS — with hierarchy levels
-- ============================================================================

-- Clear department_id and update levels for existing designations
UPDATE designations SET level = 9 WHERE name = 'Partner';
UPDATE designations SET level = 6 WHERE name = 'Manager';
UPDATE designations SET level = 3 WHERE name = 'Senior Associate';
UPDATE designations SET level = 2 WHERE name = 'Associate';
UPDATE designations SET level = 1 WHERE name = 'Junior Associate';
UPDATE designations SET level = 0 WHERE name = 'Intern';
UPDATE designations SET level = 0 WHERE name = 'Article Assistant';

-- Insert new designations
INSERT INTO designations (name, level) VALUES
  ('Managing Partner', 10),
  ('Director', 8),
  ('Senior Manager', 7),
  ('Assistant Manager', 5),
  ('Team Lead', 4),
  ('Executive', 3),
  ('Assistant', 1)
ON CONFLICT (name) DO UPDATE SET level = EXCLUDED.level;

-- ============================================================================
-- ROLE PERMISSIONS — Comprehensive per-role module permissions
-- ============================================================================

-- Helper: grant permissions for a role across modules
-- Format: (role_name, module, actions[], scope)

DO $$
DECLARE
  r RECORD;
  mod TEXT;
  act TEXT;
  modules_operational TEXT[] := ARRAY[
    'clients', 'leads', 'services', 'tasks', 'dscs', 'licenses',
    'passwords', 'documents', 'compliance', 'notices', 'bundles',
    'communications'
  ];
  modules_team TEXT[] := ARRAY['team', 'attendance', 'leave'];
  modules_system TEXT[] := ARRAY['settings', 'api_keys', 'webhooks'];
  modules_other TEXT[] := ARRAY['chat', 'calendar', 'sprints', 'reports'];
BEGIN

  -- =========================================================================
  -- MANAGING PARTNER (level 10) — everything, scope: all
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name = 'Managing Partner' LOOP
    FOREACH mod IN ARRAY modules_operational || modules_team || modules_system || modules_other LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update', 'delete', 'export'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'all')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'all';
      END LOOP;
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- PARTNER (level 9) — all operational + team read, scope: all
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name = 'Partner' LOOP
    -- Operational: full CRUD + export
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update', 'delete', 'export'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'all')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'all';
      END LOOP;
    END LOOP;
    -- Team: read + export
    FOREACH mod IN ARRAY modules_team LOOP
      FOREACH act IN ARRAY ARRAY['read', 'export'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'all')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'all';
      END LOOP;
    END LOOP;
    -- Other: full
    FOREACH mod IN ARRAY modules_other LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update', 'delete'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'all')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'all';
      END LOOP;
    END LOOP;
    -- Settings: read only
    INSERT INTO role_permissions (role_id, module, action, allowed, scope)
    VALUES (r.id, 'settings', 'read', true, 'all')
    ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'all';
  END LOOP;

  -- =========================================================================
  -- DIRECTOR (level 8) — department scope, full CRUD on operational
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name = 'Director' LOOP
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update', 'delete', 'export'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'department')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'department';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_team LOOP
      FOREACH act IN ARRAY ARRAY['read'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'department')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'department';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_other LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'department')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'department';
      END LOOP;
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- SENIOR MANAGER (level 7) — department scope, CRUD no delete
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name = 'Senior Manager' LOOP
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update', 'export'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'department')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'department';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_team LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'department')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'department';
    END LOOP;
    FOREACH mod IN ARRAY modules_other LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'team')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'team';
      END LOOP;
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- MANAGER (level 6) — team scope, CRUD no delete
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name = 'Manager' LOOP
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update', 'export'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'team')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'team';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_team LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'team')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'team';
    END LOOP;
    FOREACH mod IN ARRAY modules_other LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'team')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'team';
      END LOOP;
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- ASSISTANT MANAGER (level 5) — assigned scope, CRU
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name = 'Assistant Manager' LOOP
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'assigned')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'assigned';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_other LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'assigned')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'assigned';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_team LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'team')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'team';
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- TEAM LEAD (level 4) — assigned scope, CRU
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name = 'Team Lead' LOOP
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'assigned')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'assigned';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_other LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'assigned')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'assigned';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_team LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'team')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'team';
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- SENIOR ASSOCIATE + EXECUTIVE (level 3) — assigned scope, CRU own work
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name IN ('Senior Associate', 'Executive') LOOP
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'assigned')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'assigned';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_other LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'own')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'own';
      END LOOP;
    END LOOP;
    -- Own attendance/leave
    FOREACH mod IN ARRAY modules_team LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'own')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'own';
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- ASSOCIATE (level 2) — own scope, create + read
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name = 'Associate' LOOP
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'assigned')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'assigned';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_other LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'own')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'own';
    END LOOP;
    FOREACH mod IN ARRAY modules_team LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'own')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'own';
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- JUNIOR ASSOCIATE + ASSISTANT (level 1) — own scope, create + read own
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name IN ('Junior Associate', 'Assistant') LOOP
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'own')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'own';
      END LOOP;
    END LOOP;
    FOREACH mod IN ARRAY modules_team LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'own')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'own';
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- ARTICLE ASSISTANT (level 0) — read only on assigned
  -- =========================================================================
  FOR r IN SELECT id FROM roles WHERE name = 'Article Assistant' LOOP
    FOREACH mod IN ARRAY modules_operational LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'assigned')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'assigned';
    END LOOP;
    FOREACH mod IN ARRAY modules_team LOOP
      INSERT INTO role_permissions (role_id, module, action, allowed, scope)
      VALUES (r.id, mod, 'read', true, 'own')
      ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'own';
    END LOOP;
  END LOOP;

END;
$$;

-- ============================================================================
-- Update module_settings: remove todos (merged into tasks)
-- ============================================================================
DELETE FROM module_settings WHERE module_name = 'todos';
INSERT INTO module_settings (module_name, is_enabled) VALUES
  ('bundles', true),
  ('communications', true)
ON CONFLICT (module_name) DO NOTHING;
