import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { createServiceSchema } from '@/lib/validators/services'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const url = new URL(req.url)
  const association = url.searchParams.get('association')

  // Build select — use !inner join when filtering by association
  let selectStr = '*, service_categories(id, name)'
  if (association === 'clients') {
    selectStr += ', client_services!inner(service_id)'
  } else if (association === 'tasks') {
    selectStr += ', tasks!inner(id)'
  } else if (association === 'templates') {
    selectStr += ', recurring_tasks!inner(id)'
  } else if (association === 'bundles') {
    selectStr += ', service_bundle_items!inner(service_id)'
  }

  let query = supabase
    .from('services')
    .select(selectStr, { count: 'exact' })
    .is('deleted_at', null)

  // Filter embedded resources for soft-deleted records
  if (association === 'tasks') {
    query = query.is('tasks.deleted_at' as any, null)
  } else if (association === 'templates') {
    query = query.is('recurring_tasks.deleted_at' as any, null)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  // Get association counts via RPC
  const ids = (data || []).map((s: any) => s.id)
  let countsMap: Record<string, any> = {}

  if (ids.length > 0) {
    const { data: counts } = await supabase.rpc('get_service_counts', {
      p_service_ids: ids,
    })
    if (counts) {
      counts.forEach((c: any) => {
        countsMap[c.service_id] = {
          clients: Number(c.client_count),
          tasks: Number(c.task_count),
          templates: Number(c.template_count),
          bundles: Number(c.bundle_count),
        }
      })
    }
  }

  // Strip inner-join artifacts, add counts
  const enriched = (data || []).map((s: any) => {
    const { client_services, tasks, recurring_tasks, service_bundle_items, ...rest } = s
    return {
      ...rest,
      _counts: countsMap[s.id] || { clients: 0, tasks: 0, templates: 0, bundles: 0 },
    }
  })

  return NextResponse.json({
    success: true,
    data: enriched,
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
