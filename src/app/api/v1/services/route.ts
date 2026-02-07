import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { createServiceSchema } from '@/lib/validators/services'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)

  let query = supabase
    .from('services')
    .select('*, service_categories(id, name)', { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`name.ilike.%${search}%,sac_code.ilike.%${search}%`)
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}, { requirePermission: { module: 'services', action: 'read' } })

export const POST = apiHandler(async (req, { supabase }) => {
  const body = await req.json()
  const validated = createServiceSchema.parse(body)

  const { data, error } = await supabase
    .from('services')
    .insert(validated)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'services', action: 'create' } })
