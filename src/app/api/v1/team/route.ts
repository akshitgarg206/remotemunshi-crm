import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { z } from 'zod'

const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  mobile: z.string().optional(),
  role_id: z.string().uuid().optional(),
  designation_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  reporting_to: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active'),
  join_date: z.string().optional(),
  salary: z.number().min(0).optional(),
  is_admin: z.boolean().default(false),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['status', 'department_id', 'role_id', 'designation_id'])

  let query = supabase
    .from('employees')
    .select(`
      id, employee_code, name, email, mobile, status, join_date, avatar_url, is_admin,
      roles(id, name),
      designations(id, name),
      departments(id, name)
    `, { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%`)
  }

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.department_id) query = query.eq('department_id', filters.department_id)
  if (filters.role_id) query = query.eq('role_id', filters.role_id)

  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}, { requirePermission: { module: 'team', action: 'read' } })

export const POST = apiHandler(async (req, { supabase }) => {
  const body = await req.json()
  const validated = createEmployeeSchema.parse(body)
  const { password, ...employeeData } = validated

  // Create auth user first
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: validated.email,
    password,
    email_confirm: true,
  })

  if (authError) throw authError

  // Create employee record
  const { data: employee, error } = await supabase
    .from('employees')
    .insert({ ...employeeData, auth_user_id: authUser.user.id })
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({ success: true, data: employee }, { status: 201 })
}, { requirePermission: { module: 'team', action: 'create' } })
