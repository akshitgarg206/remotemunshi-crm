import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateLeadSchema } from '@/lib/validators/leads'
import { logActivity } from '@/lib/api/log-activity'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_assignees(employee_id, employees(id, name, email)),
      lead_bundles(bundle_id, service_bundles(id, name)),
      lead_stages(id, name, color)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'leads', action: 'read' } })

export const PUT = apiHandler(async (req, { params, supabase, employeeId }) => {
  const body = await req.json()
  const validated = updateLeadSchema.parse(body)
  const { assignee_ids, bundle_ids, ...leadData } = validated

  // Fetch old values for activity logging (especially stage changes)
  const { data: oldLead } = await supabase
    .from('leads')
    .select('stage_id, temperature, is_active')
    .eq('id', params.id)
    .single()

  const { data, error } = await supabase
    .from('leads')
    .update(leadData)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  // Log activity for significant changes
  const changes: Record<string, unknown> = {}
  if (leadData.stage_id && oldLead && leadData.stage_id !== oldLead.stage_id) {
    changes.stage_id = { old: oldLead.stage_id, new: leadData.stage_id }
  }
  if (leadData.temperature && oldLead && leadData.temperature !== oldLead.temperature) {
    changes.temperature = { old: oldLead.temperature, new: leadData.temperature }
  }
  if (leadData.is_active !== undefined && oldLead && leadData.is_active !== oldLead.is_active) {
    changes.is_active = { old: oldLead.is_active, new: leadData.is_active }
  }

  const action = Object.keys(changes).includes('stage_id')
    ? 'lead_stage_changed'
    : Object.keys(changes).includes('is_active')
    ? 'lead_status_changed'
    : 'lead_updated'

  const description = Object.keys(changes).includes('stage_id')
    ? `Changed lead stage`
    : Object.keys(changes).includes('is_active')
    ? `Marked lead as ${leadData.is_active ? 'active' : 'inactive'}`
    : `Updated lead`

  await logActivity(supabase, {
    employeeId,
    action,
    entityType: 'lead',
    entityId: params.id,
    oldValues: oldLead,
    newValues: leadData,
    description,
  })

  if (assignee_ids !== undefined) {
    await supabase.from('lead_assignees').delete().eq('lead_id', params.id)
    if (assignee_ids.length) {
      await supabase.from('lead_assignees').insert(
        assignee_ids.map((eid) => ({ lead_id: params.id, employee_id: eid }))
      )
    }
  }

  if (bundle_ids !== undefined) {
    await supabase.from('lead_bundles').delete().eq('lead_id', params.id)
    if (bundle_ids.length) {
      await supabase.from('lead_bundles').insert(
        bundle_ids.map((bid) => ({ lead_id: params.id, bundle_id: bid }))
      )
    }
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'leads', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
}, { requirePermission: { module: 'leads', action: 'delete' } })
