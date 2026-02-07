-- ============================================================================
-- Remote Munshi CRM — Migration 00023: Split Managing Partner into IT Super Admin + Managing Partner
-- ============================================================================
-- Managing Partner: business/operational focus — full CRUD on operational + team + other, read on settings
-- IT Super Admin: system/technical focus — full CRUD on system + team, read on operational

-- 1. Insert IT Super Admin role
INSERT INTO roles (name, description, is_system, permission_level) VALUES
  ('IT Super Admin', 'Full system/technical access — settings, API keys, webhooks, team management, infrastructure', true, 10)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permission_level = EXCLUDED.permission_level,
  is_system = EXCLUDED.is_system;

-- 2. Add IT Super Admin designation
INSERT INTO designations (name, level) VALUES
  ('IT Super Admin', 10)
ON CONFLICT (name) DO UPDATE SET level = EXCLUDED.level;

-- 3. Revoke system module permissions from Managing Partner (keep settings read-only)
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'Managing Partner')
  AND module IN ('settings', 'api_keys', 'webhooks')
  AND action != 'read';

-- Also set settings to read-only scope for Managing Partner
UPDATE role_permissions
SET scope = 'all'
WHERE role_id = (SELECT id FROM roles WHERE name = 'Managing Partner')
  AND module = 'settings'
  AND action = 'read';

-- 4. Grant IT Super Admin permissions
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

  FOR r IN SELECT id FROM roles WHERE name = 'IT Super Admin' LOOP

    -- System modules: full CRUD + export, scope: all
    FOREACH mod IN ARRAY modules_system LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update', 'delete', 'export'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'all')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'all';
      END LOOP;
    END LOOP;

    -- Team modules: full CRUD + export, scope: all (manage employees, attendance, leave)
    FOREACH mod IN ARRAY modules_team LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update', 'delete', 'export'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'all')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'all';
      END LOOP;
    END LOOP;

    -- Operational modules: read + export only (can view business data but not modify)
    FOREACH mod IN ARRAY modules_operational LOOP
      FOREACH act IN ARRAY ARRAY['read', 'export'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'all')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'all';
      END LOOP;
    END LOOP;

    -- Other modules: full CRUD (chat, calendar, sprints, reports)
    FOREACH mod IN ARRAY modules_other LOOP
      FOREACH act IN ARRAY ARRAY['create', 'read', 'update', 'delete'] LOOP
        INSERT INTO role_permissions (role_id, module, action, allowed, scope)
        VALUES (r.id, mod, act, true, 'all')
        ON CONFLICT (role_id, module, action) DO UPDATE SET allowed = true, scope = 'all';
      END LOOP;
    END LOOP;

  END LOOP;

END;
$$;
