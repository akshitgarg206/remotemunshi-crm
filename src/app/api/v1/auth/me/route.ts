import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase, userId }) => {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: employee } = await supabase
    .from('employees')
    .select('*, roles(id, name), departments(id, name), designations(id, name)')
    .eq('auth_user_id', user?.id ?? '')
    .single()

  // Fetch role permissions for client-side RBAC
  let permissions: { module: string; action: string; allowed: boolean; scope: string }[] = []
  if (employee?.role_id) {
    const { data: perms } = await supabase
      .from('role_permissions')
      .select('module, action, allowed, scope')
      .eq('role_id', employee.role_id)

    permissions = perms ?? []
  }

  return NextResponse.json({
    success: true,
    data: { user, employee, permissions },
  })
})
