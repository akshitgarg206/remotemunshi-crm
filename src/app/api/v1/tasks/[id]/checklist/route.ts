import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { z } from 'zod'

const checklistItemSchema = z.object({
  title: z.string().min(1),
  sort_order: z.number().default(0),
})

const toggleCheckSchema = z.object({
  is_checked: z.boolean(),
})

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('task_checklist_items')
    .select('*')
    .eq('task_id', params.id)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'tasks', action: 'read' } })

export const POST = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = checklistItemSchema.parse(body)

  const { data, error } = await supabase
    .from('task_checklist_items')
    .insert({ task_id: params.id, ...validated })
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'tasks', action: 'create' } })

export const PATCH = apiHandler(async (req, { params, supabase, employeeId }) => {
  const body = await req.json()
  const { id, is_checked } = toggleCheckSchema.extend({ id: z.string().uuid() }).parse(body)

  const { data, error } = await supabase
    .from('task_checklist_items')
    .update({
      is_checked,
      checked_by: is_checked ? employeeId : null,
      checked_at: is_checked ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('task_id', params.id)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'tasks', action: 'update' } })
