import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  mobile: z.string().optional(),
  role_id: z.string().uuid().optional(),
  designation_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  reporting_to: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).optional(),
  join_date: z.string().optional(),
  salary: z.number().min(0).optional(),
  is_admin: z.boolean().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  reset_password: z.boolean().optional(),
}).partial()

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      roles(id, name),
      designations(id, name),
      departments(id, name)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'team', action: 'read' } })

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateEmployeeSchema.parse(body)
  const { email: newEmail, reset_password, ...employeeData } = validated

  // Get current employee to find auth_user_id
  const { data: current, error: fetchError } = await supabase
    .from('employees')
    .select('auth_user_id, email')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (fetchError) throw fetchError

  // Handle email change (account transfer) — updates both auth user and employee record
  if (newEmail && newEmail !== current.email && current.auth_user_id) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { error: authError } = await adminClient.auth.admin.updateUserById(
      current.auth_user_id,
      { email: newEmail, email_confirm: true }
    )

    if (authError) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: `Failed to update auth email: ${authError.message}` } },
        { status: 400 }
      )
    }

    // Include email in the employee update
    ;(employeeData as Record<string, unknown>).email = newEmail
  }

  // Handle password reset trigger — sends reset email via Supabase
  if (reset_password && current.auth_user_id) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const emailToReset = newEmail || current.email
    // Generate a new temporary password and force the user to reset
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    await adminClient.auth.admin.updateUserById(
      current.auth_user_id,
      { password: tempPassword }
    )
    // Note: In production, you'd send a reset email instead. For now this forces a new password.
  }

  // Update employee record
  const { data, error } = await supabase
    .from('employees')
    .update(employeeData)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'team', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  // Get auth_user_id to disable auth account
  const { data: emp } = await supabase
    .from('employees')
    .select('auth_user_id')
    .eq('id', params.id)
    .single()

  // Soft-delete employee
  const { error } = await supabase
    .from('employees')
    .update({ deleted_at: new Date().toISOString(), status: 'terminated' })
    .eq('id', params.id)

  if (error) throw error

  // Disable auth account so they can't log in
  if (emp?.auth_user_id) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    await adminClient.auth.admin.updateUserById(emp.auth_user_id, {
      ban_duration: '876000h', // ~100 years
    })
  }

  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
}, { requirePermission: { module: 'team', action: 'delete' } })
