import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateBundleSchema } from '@/lib/validators/bundles'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('service_bundles')
    .select('*, service_bundle_items(service_id, services(id, name, sac_code, default_rate, service_categories(id, name)))')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Bundle not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'bundles', action: 'read' } })

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const { service_ids, ...bundleData } = updateBundleSchema.parse(body)

  // Update bundle fields if any provided
  if (Object.keys(bundleData).length > 0) {
    const { error: updateError } = await supabase
      .from('service_bundles')
      .update(bundleData)
      .eq('id', params.id)
      .is('deleted_at', null)

    if (updateError) throw updateError
  }

  // Replace bundle items if service_ids provided
  if (service_ids !== undefined) {
    await supabase.from('service_bundle_items').delete().eq('bundle_id', params.id)

    if (service_ids.length) {
      const items = service_ids.map((service_id) => ({
        bundle_id: params.id,
        service_id,
      }))
      const { error: itemsError } = await supabase
        .from('service_bundle_items')
        .insert(items)
      if (itemsError) throw itemsError
    }
  }

  // Re-fetch updated bundle
  const { data, error } = await supabase
    .from('service_bundles')
    .select('*, service_bundle_items(service_id, services(id, name))')
    .eq('id', params.id)
    .single()

  if (error) throw error

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'bundles', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('service_bundles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
}, { requirePermission: { module: 'bundles', action: 'delete' } })
