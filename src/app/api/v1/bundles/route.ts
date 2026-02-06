import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { createBundleSchema } from '@/lib/validators/bundles'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)

  let query = supabase
    .from('service_bundles')
    .select('*, service_bundle_items(service_id, services(id, name))', { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
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
})

export const POST = apiHandler(async (req, { supabase }) => {
  const body = await req.json()
  const { service_ids, ...bundleData } = createBundleSchema.parse(body)

  // Insert the bundle
  const { data: bundle, error: bundleError } = await supabase
    .from('service_bundles')
    .insert(bundleData)
    .select()
    .single()

  if (bundleError) throw bundleError

  // Insert bundle items
  const items = service_ids.map((service_id) => ({
    bundle_id: bundle.id,
    service_id,
  }))

  const { error: itemsError } = await supabase
    .from('service_bundle_items')
    .insert(items)

  if (itemsError) throw itemsError

  // Re-fetch with items joined
  const { data, error } = await supabase
    .from('service_bundles')
    .select('*, service_bundle_items(service_id, services(id, name))')
    .eq('id', bundle.id)
    .single()

  if (error) throw error

  return NextResponse.json({ success: true, data }, { status: 201 })
})
