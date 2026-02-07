import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { upsertOverrideSchema } from '@/lib/validators/client-template-overrides'

// GET /api/v1/clients/:id/template-overrides — List all overrides for a client
export const GET = apiHandler(async (req, { supabase, params }) => {
  const { data, error } = await supabase
    .from('client_template_overrides')
    .select(`
      *,
      recurring_tasks(id, task_name, service_id, frequency, checklist_template, services(id, name))
    `)
    .eq('client_id', params.id)

  if (error) throw error

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'clients', action: 'read' } })

// POST /api/v1/clients/:id/template-overrides — Create or update override
export const POST = apiHandler(async (req, { supabase, employeeId, params }) => {
  const body = await req.json()
  const validated = upsertOverrideSchema.parse(body)

  const { data, error } = await supabase
    .from('client_template_overrides')
    .upsert({
      client_id: params.id,
      recurring_task_id: validated.recurring_task_id,
      additional_steps: validated.additional_steps,
      notes: validated.notes,
      created_by: employeeId,
    }, { onConflict: 'client_id,recurring_task_id' })
    .select(`
      *,
      recurring_tasks(id, task_name, services(id, name))
    `)
    .single()

  if (error) throw error

  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'clients', action: 'update' } })

// DELETE /api/v1/clients/:id/template-overrides — Remove override
export const DELETE = apiHandler(async (req, { supabase, params }) => {
  const { searchParams } = new URL(req.url)
  const templateId = searchParams.get('template_id')

  if (!templateId) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'template_id required' } },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('client_template_overrides')
    .delete()
    .eq('client_id', params.id)
    .eq('recurring_task_id', templateId)

  if (error) throw error

  return NextResponse.json({ success: true, data: { deleted: true } })
}, { requirePermission: { module: 'clients', action: 'delete' } })
