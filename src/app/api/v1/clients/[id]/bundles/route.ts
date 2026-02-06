import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { assignBundleSchema } from '@/lib/validators/bundles'

// GET /api/v1/clients/:id/bundles — list bundles assigned to client
export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('client_bundles')
    .select('*, service_bundles(id, name, bundle_price)')
    .eq('client_id', params.id)

  if (error) throw error

  return NextResponse.json({ success: true, data })
})

// POST /api/v1/clients/:id/bundles — assign bundle to client
export const POST = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = assignBundleSchema.parse(body)

  // Insert client_bundles row
  const { data: clientBundle, error: cbError } = await supabase
    .from('client_bundles')
    .insert({
      client_id: params.id,
      bundle_id: validated.bundle_id,
      agreed_price: validated.agreed_price,
      start_date: validated.start_date,
      end_date: validated.end_date,
    })
    .select()
    .single()

  if (cbError) throw cbError

  // Fetch service_ids from the bundle
  const { data: bundleItems, error: biError } = await supabase
    .from('service_bundle_items')
    .select('service_id')
    .eq('bundle_id', validated.bundle_id)

  if (biError) throw biError

  // Insert individual client_services rows for each service in the bundle
  if (bundleItems && bundleItems.length > 0) {
    const serviceRows = bundleItems.map((item) => ({
      client_id: params.id,
      service_id: item.service_id,
    }))

    // Use upsert to avoid duplicates if the client already has some of these services
    const { error: csError } = await supabase
      .from('client_services')
      .upsert(serviceRows, { onConflict: 'client_id,service_id', ignoreDuplicates: true })

    if (csError) throw csError
  }

  return NextResponse.json({ success: true, data: clientBundle }, { status: 201 })
})
