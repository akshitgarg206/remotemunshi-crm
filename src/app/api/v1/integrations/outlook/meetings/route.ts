import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { getGraphWithAutoRefresh } from '@/lib/integrations/outlook/client'
import { logActivity } from '@/lib/api/log-activity'

// GET — list calendar events via Graph API
export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const { data: conn, error } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('provider', 'outlook')
    .eq('status', 'connected')
    .single()

  if (error || !conn) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_CONNECTED', message: 'Outlook not connected' } },
      { status: 400 }
    )
  }

  const result = await getGraphWithAutoRefresh(
    supabase, conn.id, conn.access_token_encrypted, conn.refresh_token_encrypted,
    conn.token_expires_at,
    '/me/events?$top=50&$select=subject,start,end,attendees,organizer,location&$orderby=start/dateTime desc'
  ) as { value: unknown[] }

  return NextResponse.json({ success: true, data: result.value || [] })
}, { requireAuth: true })

// POST — create leads from meeting attendees
export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const { meetings } = await req.json() as { meetings: Record<string, unknown>[] }

  if (!meetings?.length) {
    return NextResponse.json({ success: false, error: { code: 'NO_DATA', message: 'No meetings to import' } }, { status: 400 })
  }

  let imported = 0
  let skipped = 0

  for (const meeting of meetings) {
    const attendees = (meeting.attendees as { emailAddress?: { name?: string; address?: string } }[]) || []

    for (const attendee of attendees) {
      const email = attendee.emailAddress?.address || ''
      const name = attendee.emailAddress?.name || ''
      const externalId = `meeting:${meeting.id}:${email}`

      // Dedup check
      const { data: existing } = await supabase
        .from('lead_import_log')
        .select('id')
        .eq('source', 'outlook')
        .eq('external_id', externalId)
        .single()

      if (existing) { skipped++; continue }

      const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .insert({
          business_name: name || email,
          contact_person: name || null,
          email: email || null,
          source: 'meeting',
          external_source: 'outlook',
          external_id: externalId,
          external_metadata: { meeting_subject: meeting.subject, meeting_id: meeting.id },
          notes: `From meeting: ${meeting.subject || 'Untitled'}`,
          created_by: employeeId,
        })
        .select('id')
        .single()

      if (leadErr) continue

      await supabase.from('lead_import_log').insert({
        lead_id: lead.id,
        source: 'outlook',
        external_id: externalId,
        metadata: { type: 'meeting_attendee', meeting_subject: meeting.subject },
        imported_by: employeeId,
      })

      imported++
    }
  }

  await logActivity(supabase, {
    employeeId,
    action: 'leads_imported',
    entityType: 'integration',
    entityId: 'outlook',
    description: `Imported ${imported} leads from Outlook meetings (${skipped} skipped)`,
  })

  return NextResponse.json({ success: true, data: { imported, skipped } })
}, { requirePermission: { module: 'leads', action: 'create' } })
