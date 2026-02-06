import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateContactSchema } from '@/lib/validators/contacts'

export const GET = apiHandler(async (req, { supabase, params }) => {
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      client_contacts(client_id, role, is_primary, clients(id, business_name))
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
})

export const PUT = apiHandler(async (req, { supabase, params }) => {
  const body = await req.json()
  const validated = updateContactSchema.parse(body)
  const { client_ids, ...contactData } = validated

  const { data, error } = await supabase
    .from('contacts')
    .update(contactData)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  if (client_ids !== undefined) {
    await supabase.from('client_contacts').delete().eq('contact_id', params.id)
    if (client_ids.length) {
      await supabase.from('client_contacts').insert(
        client_ids.map((link) => ({
          client_id: link.client_id,
          contact_id: params.id,
          role: link.role,
          is_primary: link.is_primary,
        }))
      )
    }
  }

  return NextResponse.json({ success: true, data })
})

export const DELETE = apiHandler(async (req, { supabase, params }) => {
  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error

  return NextResponse.json({ success: true, data: { deleted: true } })
})
