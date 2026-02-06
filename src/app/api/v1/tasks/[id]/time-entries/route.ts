import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { createTimeEntrySchema } from '@/lib/validators/tasks'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*, employees(id, name)')
    .eq('task_id', params.id)
    .order('date', { ascending: false })

  if (error) throw error
  return NextResponse.json({ success: true, data })
})

export const POST = apiHandler(async (req, { params, supabase, userId }) => {
  const body = await req.json()
  const validated = createTimeEntrySchema.parse(body)

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', userId)
    .single()

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      ...validated,
      task_id: params.id,
      employee_id: employee?.id,
    })
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
})
