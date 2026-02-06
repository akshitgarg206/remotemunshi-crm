import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { linkContactSchema } from '@/lib/validators/contacts'

// GET /api/v1/clients/:id/contacts — List contacts for a client
export const GET = apiHandler(async (req, { supabase, params }) => {
  const { data, error } = await supabase
    .from('client_contacts')
    .select(`
      id,
      role,
      is_primary,
      contacts(id, name, email, mobile, phone, designation, department, notes)
    `)
    .eq('client_id', params.id)

  if (error) throw error

  return NextResponse.json({ success: true, data })
})

// POST /api/v1/clients/:id/contacts — Link existing contact to client
export const POST = apiHandler(async (req, { supabase, params }) => {
  const body = await req.json()
  const validated = linkContactSchema.parse(body)

  const { data, error } = await supabase
    .from('client_contacts')
    .upsert({
      client_id: params.id,
      contact_id: validated.contact_id,
      role: validated.role,
      is_primary: validated.is_primary,
    }, { onConflict: 'client_id,contact_id' })
    .select(`
      id,
      role,
      is_primary,
      contacts(id, name, email, mobile, phone, designation, department)
    `)
    .single()

  if (error) throw error

  return NextResponse.json({ success: true, data }, { status: 201 })
})

// DELETE /api/v1/clients/:id/contacts — Unlink contact from client
export const DELETE = apiHandler(async (req, { supabase, params }) => {
  const { searchParams } = new URL(req.url)
  const contactId = searchParams.get('contact_id')

  if (!contactId) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'contact_id required' } },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('client_contacts')
    .delete()
    .eq('client_id', params.id)
    .eq('contact_id', contactId)

  if (error) throw error

  return NextResponse.json({ success: true, data: { unlinked: true } })
})
