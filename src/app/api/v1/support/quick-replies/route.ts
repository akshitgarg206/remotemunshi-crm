import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createQuickReplySchema } from '@/lib/validators/support-quick-replies'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, search } = parsePagination(req)
  const filters = parseFilters(req, ['category', 'channel', 'is_global'])

  let query = supabase
    .from('support_quick_replies')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,shortcut.ilike.%${search}%`)
  }

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.channel) query = query.eq('channel', filters.channel)
  if (filters.is_global) query = query.eq('is_global', filters.is_global === 'true')

  query = query.order('title', { ascending: true })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}, { requirePermission: { module: 'communications', action: 'read' } })

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createQuickReplySchema.parse(body)

  const { data, error } = await supabase
    .from('support_quick_replies')
    .insert({ ...validated, created_by: employeeId })
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'communications', action: 'create' } })
