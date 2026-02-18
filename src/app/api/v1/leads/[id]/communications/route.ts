import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createLeadCommunicationSchema } from '@/lib/validators/lead-communications'

// GET /api/v1/leads/:id/communications
export const GET = apiHandler(async (req, { params, supabase }) => {
  const { page, pageSize, offset } = parsePagination(req)
  const filters = parseFilters(req, ['channel'])

  let query = supabase
    .from('lead_communications')
    .select('*, employees(id, name)', { count: 'exact' })
    .eq('lead_id', params.id)
    .is('deleted_at', null)

  if (filters.channel) {
    query = query.eq('channel', filters.channel)
  }

  query = query.order('sent_at', { ascending: false })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}, { requirePermission: { module: 'leads', action: 'read' } })

// POST /api/v1/leads/:id/communications
export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  const body = await req.json()
  const validated = createLeadCommunicationSchema.parse(body)

  const { data, error } = await supabase
    .from('lead_communications')
    .insert({
      lead_id: params.id,
      employee_id: employeeId,
      channel: validated.channel,
      direction: validated.direction,
      subject: validated.subject,
      body: validated.body,
      from_contact: validated.from_contact,
      to_contact: validated.to_contact,
      sent_at: validated.sent_at || new Date().toISOString(),
    })
    .select('*, employees(id, name)')
    .single()

  if (error) throw error

  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'leads', action: 'create' } })
