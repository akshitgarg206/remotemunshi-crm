import { NextResponse } from 'next/server'
import { portalHandler } from '@/lib/api/portal-handler'

export const GET = portalHandler(async (req, { supabase, clientIds, params }) => {
  const { id } = params

  if (!clientIds.includes(id)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    )
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

  let query = supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, created_at, services(name)', { count: 'exact' })
    .eq('client_id', id)
    .is('deleted_at', null)
    .is('parent_task_id', null) // Only top-level tasks

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'QUERY_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, pageSize, total: count ?? 0 },
  })
})
