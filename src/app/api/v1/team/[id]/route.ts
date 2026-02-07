import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
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

  const { data, error } = await supabase
    .from('employees')
    .update(validated)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'team', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('employees')
    .update({ deleted_at: new Date().toISOString(), status: 'terminated' })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
}, { requirePermission: { module: 'team', action: 'delete' } })
