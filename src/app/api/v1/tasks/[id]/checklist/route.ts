import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { z } from 'zod'

const checklistItemSchema = z.object({
  title: z.string().min(1),
  sort_order: z.number().default(0),
  estimated_minutes: z.number().min(0).nullable().optional(),
  owner_type: z.enum(['team', 'client']).default('team'),
})

const toggleCheckSchema = z.object({
  is_checked: z.boolean(),
})

const updateTimeSchema = z.object({
  estimated_minutes: z.number().min(0).nullable().optional(),
  actual_minutes: z.number().min(0).nullable().optional(),
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

  // Determine if this is a toggle or a time update
  const { id, ...rest } = body
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'id is required' } },
      { status: 400 }
    )
  }

  // Toggle check
  if ('is_checked' in rest) {
    const { is_checked } = toggleCheckSchema.parse(rest)
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
  }

  // Owner type update
  if ('owner_type' in rest && !('estimated_minutes' in rest) && !('actual_minutes' in rest)) {
    const ownerType = z.enum(['team', 'client']).parse(rest.owner_type)
    const { data, error } = await supabase
      .from('task_checklist_items')
      .update({ owner_type: ownerType })
      .eq('id', id)
      .eq('task_id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  }

  // Time update
  if ('estimated_minutes' in rest || 'actual_minutes' in rest) {
    const validated = updateTimeSchema.parse(rest)
    const updateData: Record<string, unknown> = {}
    if ('estimated_minutes' in validated) updateData.estimated_minutes = validated.estimated_minutes
    if ('actual_minutes' in validated) updateData.actual_minutes = validated.actual_minutes

    const { data, error } = await supabase
      .from('task_checklist_items')
      .update(updateData)
      .eq('id', id)
      .eq('task_id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  }

  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION', message: 'No valid update fields provided' } },
    { status: 400 }
  )
}, { requirePermission: { module: 'tasks', action: 'update' } })
