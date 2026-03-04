import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createActivityBlockSchema, createBatchActivityBlocksSchema } from '@/lib/validators/activity-blocks'

export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const { page, pageSize, offset, sortBy, sortOrder } = parsePagination(req)
  const filters = parseFilters(req, ['date', 'category', 'employee_id', 'is_missed'])

  const targetEmployeeId = filters.employee_id || employeeId

  let query = supabase
    .from('activity_blocks')
    .select('*', { count: 'exact' })
    .eq('employee_id', targetEmployeeId)

  if (filters.date) {
    // Filter by IST date — blocks where block_start falls on this date in IST
    const dateStr = filters.date as string
    const startOfDay = `${dateStr}T00:00:00+05:30`
    const endOfDay = `${dateStr}T23:59:59.999+05:30`
    query = query.gte('block_start', startOfDay).lte('block_start', endOfDay)
  }

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.is_missed !== undefined) query = query.eq('is_missed', filters.is_missed === 'true')

  query = query.order(sortBy || 'block_start', { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
})

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()

  // Support batch creation (missed + current blocks)
  if (body.blocks) {
    const validated = createBatchActivityBlocksSchema.parse(body)
    const rows = validated.blocks.map((block) => ({
      ...block,
      employee_id: employeeId,
    }))

    const { data, error } = await supabase
      .from('activity_blocks')
      .insert(rows)
      .select()

    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  }

  // Single block creation
  const validated = createActivityBlockSchema.parse(body)
  const { data, error } = await supabase
    .from('activity_blocks')
    .insert({ ...validated, employee_id: employeeId })
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
})
