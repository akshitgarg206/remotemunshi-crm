import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const GET = apiHandler(async (req, { supabase }) => {
  const filters = parseFilters(req, [
    'view', 'service_id', 'client_id', 'group_id',
    'month', 'year', 'period_start', 'period_end', 'status',
  ])
  const view = filters.view || 'service'

  switch (view) {
    case 'service':
      return handleServiceView(req, supabase, filters)
    case 'period':
      return handlePeriodView(supabase, filters)
    case 'client':
      return handleClientView(req, supabase, filters)
    case 'group':
      return handleGroupView(req, supabase, filters)
    default:
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid view. Use: service, period, client, group' } },
        { status: 400 }
      )
  }
}, { requirePermission: { module: 'services', action: 'read' } })

// --- Service View: Pick a service + month → see status for ALL clients ---
async function handleServiceView(req: any, supabase: any, filters: Record<string, string>) {
  const { page, pageSize, offset, search } = parsePagination(req)

  if (!filters.service_id || !filters.month || !filters.year) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'service_id, month, and year are required for service view' } },
      { status: 400 }
    )
  }

  const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
  const endMonth = Number(filters.month) === 12 ? 1 : Number(filters.month) + 1
  const endYear = Number(filters.month) === 12 ? Number(filters.year) + 1 : Number(filters.year)
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  let query = supabase
    .from('service_deadlines')
    .select(`
      id, status, due_date, data_received, data_received_at, period_label, period_start, notes, task_id,
      clients(id, business_name, client_code, email, mobile),
      services(id, name),
      tasks(id, task_name, status)
    `, { count: 'exact' })
    .eq('service_id', filters.service_id)
    .gte('period_start', startDate)
    .lt('period_start', endDate)
    .is('deleted_at', null)

  if (filters.status) query = query.eq('status', filters.status)

  if (search) {
    query = query.ilike('clients.business_name', `%${search}%`)
  }

  query = query.order('clients(business_name)', { ascending: true })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}

// --- Period View: Pick a date range → see aggregated filed/total per service per month ---
async function handlePeriodView(supabase: any, filters: Record<string, string>) {
  if (!filters.period_start || !filters.period_end) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'period_start and period_end are required for period view' } },
      { status: 400 }
    )
  }

  // Supabase JS doesn't support DATE_TRUNC/GROUP BY, so use raw RPC or fetch+aggregate in JS
  // Fetch all deadlines in range and aggregate in memory
  const { data, error } = await supabase
    .from('service_deadlines')
    .select('service_id, status, period_start, due_date, services(id, name)')
    .gte('period_start', filters.period_start)
    .lte('period_start', filters.period_end)
    .is('deleted_at', null)
    .order('period_start', { ascending: true })
    .limit(5000)

  if (error) throw error

  // Aggregate: group by service + month
  const aggregated: Record<string, Record<string, { total: number; filed: number; overdue: number }>> = {}
  const serviceNames: Record<string, string> = {}
  const now = new Date()

  for (const row of (data || [])) {
    const svcId = row.service_id
    const svcName = (row.services as any)?.name || 'Unknown'
    serviceNames[svcId] = svcName

    // Month key: YYYY-MM
    const monthKey = row.period_start?.substring(0, 7) || 'unknown'

    if (!aggregated[svcId]) aggregated[svcId] = {}
    if (!aggregated[svcId][monthKey]) aggregated[svcId][monthKey] = { total: 0, filed: 0, overdue: 0 }

    aggregated[svcId][monthKey].total++
    if (row.status === 'filed') aggregated[svcId][monthKey].filed++
    if (row.due_date && new Date(row.due_date) < now && row.status !== 'filed') {
      aggregated[svcId][monthKey].overdue++
    }
  }

  // Transform to array format
  const result = Object.entries(aggregated).map(([serviceId, months]) => ({
    service_id: serviceId,
    service_name: serviceNames[serviceId],
    months: Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({ month, ...counts })),
  }))
  result.sort((a, b) => a.service_name.localeCompare(b.service_name))

  return NextResponse.json({ success: true, data: result })
}

// --- Client View: Pick a client → see all their services x months ---
async function handleClientView(req: any, supabase: any, filters: Record<string, string>) {
  if (!filters.client_id) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'client_id is required for client view' } },
      { status: 400 }
    )
  }

  const periodStart = filters.period_start || `${new Date().getFullYear()}-01-01`
  const periodEnd = filters.period_end || `${new Date().getFullYear()}-12-31`

  const { data, error } = await supabase
    .from('service_deadlines')
    .select(`
      id, service_id, status, due_date, data_received, period_start, period_label, task_id,
      services(id, name),
      tasks(id, task_name, status)
    `)
    .eq('client_id', filters.client_id)
    .gte('period_start', periodStart)
    .lte('period_start', periodEnd)
    .is('deleted_at', null)
    .order('period_start', { ascending: true })
    .limit(1000)

  if (error) throw error

  // Group by service → months
  const grouped: Record<string, { service_name: string; deadlines: any[] }> = {}

  for (const row of (data || [])) {
    const svcId = row.service_id
    if (!grouped[svcId]) {
      grouped[svcId] = {
        service_name: (row.services as any)?.name || 'Unknown',
        deadlines: [],
      }
    }
    grouped[svcId].deadlines.push(row)
  }

  const result = Object.entries(grouped).map(([serviceId, { service_name, deadlines }]) => ({
    service_id: serviceId,
    service_name,
    deadlines,
  }))
  result.sort((a, b) => a.service_name.localeCompare(b.service_name))

  return NextResponse.json({ success: true, data: result })
}

// --- Group View: Pick a group + service → see status for group members ---
async function handleGroupView(req: any, supabase: any, filters: Record<string, string>) {
  const { page, pageSize, offset, search } = parsePagination(req)

  if (!filters.group_id || !filters.service_id || !filters.month || !filters.year) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'group_id, service_id, month, and year are required for group view' } },
      { status: 400 }
    )
  }

  // Get group member client IDs
  const { data: members, error: membersError } = await supabase
    .from('client_group_members')
    .select('client_id')
    .eq('group_id', filters.group_id)

  if (membersError) throw membersError
  const clientIds = (members || []).map((m: any) => m.client_id)

  if (clientIds.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      meta: paginationMeta(0, page, pageSize),
    })
  }

  const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
  const endMonth = Number(filters.month) === 12 ? 1 : Number(filters.month) + 1
  const endYear = Number(filters.month) === 12 ? Number(filters.year) + 1 : Number(filters.year)
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  let query = supabase
    .from('service_deadlines')
    .select(`
      id, status, due_date, data_received, data_received_at, period_label, period_start, notes, task_id,
      clients(id, business_name, client_code, email, mobile),
      services(id, name),
      tasks(id, task_name, status)
    `, { count: 'exact' })
    .eq('service_id', filters.service_id)
    .in('client_id', clientIds)
    .gte('period_start', startDate)
    .lt('period_start', endDate)
    .is('deleted_at', null)

  if (filters.status) query = query.eq('status', filters.status)

  if (search) {
    query = query.ilike('clients.business_name', `%${search}%`)
  }

  query = query.order('clients(business_name)', { ascending: true })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}
