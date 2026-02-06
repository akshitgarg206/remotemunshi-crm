import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { page, pageSize, offset } = parsePagination(req)

  const { data, error, count } = await supabase
    .from('webhook_deliveries')
    .select('*', { count: 'exact' })
    .eq('webhook_id', params.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) throw error
  return NextResponse.json({ success: true, data, meta: paginationMeta(count || 0, page, pageSize) })
})
