import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { createTaskCommentSchema } from '@/lib/validators/tasks'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, employees(id, name, avatar_url)')
    .eq('task_id', params.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'tasks', action: 'read' } })

export const POST = apiHandler(async (req, { params, supabase, userId }) => {
  const body = await req.json()
  const validated = createTaskCommentSchema.parse(body)

  // Get employee_id from auth user
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', userId)
    .single()

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: params.id,
      employee_id: employee?.id,
      comment: validated.comment,
      attachments: validated.attachments || [],
    })
    .select('*, employees(id, name, avatar_url)')
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'tasks', action: 'create' } })
