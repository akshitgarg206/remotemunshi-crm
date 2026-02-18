import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { logActivity } from '@/lib/api/log-activity'

// POST /api/v1/support/conversations/:id/convert-to-lead
// Creates a lead from a WhatsApp conversation's contact data
export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  // Fetch conversation with contact and client data
  const { data: conversation, error: convErr } = await supabase
    .from('support_conversations')
    .select('*, contacts(id, name, email, phone, mobile), clients(id, business_name)')
    .eq('id', params.id)
    .single()

  if (convErr || !conversation) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
      { status: 404 }
    )
  }

  const contact = conversation.contacts
  const client = conversation.clients

  // Don't convert if already linked to a client
  if (client) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_CLIENT', message: 'This conversation is already linked to a client' } },
      { status: 400 }
    )
  }

  // Build lead data from contact
  const leadData = {
    business_name: contact?.name || 'Unknown Contact',
    contact_person: contact?.name || null,
    contact_no: contact?.mobile || contact?.phone || null,
    email: contact?.email || null,
    source: 'whatsapp' as const,
    external_source: 'whatsapp',
    external_metadata: { conversation_id: conversation.id },
    notes: `Created from WhatsApp conversation. Channel: ${conversation.channel}`,
    created_by: employeeId,
  }

  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single()

  if (leadErr) throw leadErr

  await logActivity(supabase, {
    employeeId,
    action: 'lead_created',
    entityType: 'lead',
    entityId: lead.id,
    newValues: { source: 'whatsapp', conversation_id: conversation.id },
    description: `Created lead from WhatsApp conversation: ${leadData.business_name}`,
  })

  return NextResponse.json({ success: true, data: lead }, { status: 201 })
}, { requirePermission: { module: 'leads', action: 'create' } })
