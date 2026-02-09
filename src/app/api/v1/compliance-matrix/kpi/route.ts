import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parseFilters } from '@/lib/api/filters'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const GET = apiHandler(async (req, { supabase }) => {
  const filters = parseFilters(req, ['service_id', 'client_id', 'group_id', 'month', 'year'])

  let query = supabase
    .from('service_deadlines')
    .select('id, status, due_date, data_received')
    .is('deleted_at', null)

  if (filters.service_id) query = query.eq('service_id', filters.service_id)
  if (filters.client_id) query = query.eq('client_id', filters.client_id)

  if (filters.month && filters.year) {
    const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const endMonth = Number(filters.month) === 12 ? 1 : Number(filters.month) + 1
    const endYear = Number(filters.month) === 12 ? Number(filters.year) + 1 : Number(filters.year)
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
    query = query.gte('period_start', startDate).lt('period_start', endDate)
  }

  // If group_id, filter to group members
  if (filters.group_id) {
    const { data: members } = await supabase
      .from('client_group_members')
      .select('client_id')
      .eq('group_id', filters.group_id)
    const clientIds = (members || []).map((m: any) => m.client_id)
    if (clientIds.length > 0) {
      query = query.in('client_id', clientIds)
    } else {
      return NextResponse.json({
        success: true,
        data: { on_track: 0, at_risk: 0, overdue: 0, completion_rate: 0, total: 0 },
      })
    }
  }

  const { data, error } = await query.limit(10000)
  if (error) throw error

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  let onTrack = 0
  let atRisk = 0
  let overdue = 0
  let filed = 0
  const total = (data || []).length

  for (const row of (data || [])) {
    const dueDate = row.due_date ? new Date(row.due_date) : null

    if (row.status === 'filed') {
      filed++
      onTrack++
    } else if (row.status === 'in_progress' && dueDate && dueDate >= now) {
      onTrack++
    } else if (dueDate && dueDate < now) {
      overdue++
    } else if (dueDate && dueDate <= sevenDaysFromNow && row.status !== 'filed') {
      atRisk++
    } else {
      onTrack++
    }
  }

  const completionRate = total > 0 ? Math.round((filed / total) * 100) : 0

  return NextResponse.json({
    success: true,
    data: { on_track: onTrack, at_risk: atRisk, overdue, completion_rate: completionRate, total, filed },
  })
}, { requirePermission: { module: 'services', action: 'read' } })
