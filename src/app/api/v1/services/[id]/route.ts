import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateServiceSchema } from '@/lib/validators/services'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('services')
    .select('*, service_categories(id, name)')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'services', action: 'read' } })

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateServiceSchema.parse(body)

  const { data, error } = await supabase
    .from('services')
    .update(validated)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'services', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  // Check if service is assigned to any active client
  const { count: clientCount } = await supabase
    .from('client_services')
    .select('*', { count: 'exact', head: true })
    .eq('service_id', params.id)
    .eq('is_active', true)

  if (clientCount && clientCount > 0) {
    return NextResponse.json(
      { success: false, error: { code: 'DELETE_BLOCKED', message: `Cannot delete — service is assigned to ${clientCount} active client(s)` } },
      { status: 409 }
    )
  }

  // Check if service is part of any active bundle
  const { count: bundleCount } = await supabase
    .from('service_bundle_items')
    .select('*, service_bundles!inner(id, deleted_at, is_active)', { count: 'exact', head: true })
    .eq('service_id', params.id)
    .is('service_bundles.deleted_at', null)
    .eq('service_bundles.is_active', true)

  if (bundleCount && bundleCount > 0) {
    return NextResponse.json(
      { success: false, error: { code: 'DELETE_BLOCKED', message: `Cannot delete — service is part of ${bundleCount} active bundle(s)` } },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('services')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
}, { requirePermission: { module: 'services', action: 'delete' } })
