import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createContactSchema } from '@/lib/validators/contacts'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['client_id'])

  let query = supabase
    .from('contacts')
    .select(`
      *,
      client_contacts(client_id, role, is_primary, clients(id, business_name))
    `, { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%,designation.ilike.%${search}%`)
  }

  // Filter by client_id via junction
  if (filters.client_id) {
    query = query.eq('client_contacts.client_id', filters.client_id)
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
}, { requirePermission: { module: 'clients', action: 'read' } })

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createContactSchema.parse(body)
  const { client_ids, ...contactData } = validated

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({ ...contactData, created_by: employeeId })
    .select()
    .single()

  if (error) throw error

  // Link to clients if provided
  if (client_ids?.length) {
    await supabase.from('client_contacts').insert(
      client_ids.map((link) => ({
        client_id: link.client_id,
        contact_id: contact.id,
        role: link.role,
        is_primary: link.is_primary,
      }))
    )
  }

  return NextResponse.json({ success: true, data: contact }, { status: 201 })
}, { requirePermission: { module: 'clients', action: 'create' } })
