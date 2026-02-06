import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateClientSchema } from '@/lib/validators/clients'

// GET /api/v1/clients/:id
export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_assignees(employee_id, employees(id, name, email, avatar_url)),
      client_services(service_id, services(id, name, default_rate)),
      client_group_members(group_id, client_groups(id, name, color))
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
})

// PUT /api/v1/clients/:id
export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateClientSchema.parse(body)

  const { group_ids, service_ids, assignee_ids, ...clientData } = validated

  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  // Update junctions if provided
  if (assignee_ids !== undefined) {
    await supabase.from('client_assignees').delete().eq('client_id', params.id)
    if (assignee_ids.length) {
      await supabase.from('client_assignees').insert(
        assignee_ids.map((eid, i) => ({
          client_id: params.id,
          employee_id: eid,
          is_primary: i === 0,
        }))
      )
    }
  }

  if (service_ids !== undefined) {
    await supabase.from('client_services').delete().eq('client_id', params.id)
    if (service_ids.length) {
      await supabase.from('client_services').insert(
        service_ids.map((sid) => ({ client_id: params.id, service_id: sid }))
      )
    }
  }

  if (group_ids !== undefined) {
    await supabase.from('client_group_members').delete().eq('client_id', params.id)
    if (group_ids.length) {
      await supabase.from('client_group_members').insert(
        group_ids.map((gid) => ({ client_id: params.id, group_id: gid }))
      )
    }
  }

  return NextResponse.json({ success: true, data })
})

// DELETE /api/v1/clients/:id (soft delete)
export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error

  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
})
