import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGraphWithAutoRefresh } from '@/lib/integrations/outlook/client'

interface Attendee {
  emailAddress?: { name?: string; address?: string }
  type?: string
}

interface CalendarEvent {
  id: string
  subject?: string
  organizer?: { emailAddress?: { address?: string } }
  attendees?: Attendee[]
  start?: { dateTime?: string }
  end?: { dateTime?: string }
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get all connected Outlook integrations
  const { data: connections, error: connErr } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('provider', 'outlook')
    .eq('status', 'connected')

  if (connErr || !connections?.length) {
    return NextResponse.json({
      success: true,
      data: { connections: 0, imported: 0, skipped: 0 },
    })
  }

  let totalImported = 0
  let totalSkipped = 0

  // Date range: last 7 days
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startDateTime = sevenDaysAgo.toISOString()
  const endDateTime = now.toISOString()

  for (const conn of connections) {
    try {
      // Fetch calendar events for last 7 days
      const result = await getGraphWithAutoRefresh(
        supabase,
        conn.id,
        conn.access_token_encrypted,
        conn.refresh_token_encrypted,
        conn.token_expires_at,
        `/me/calendarview?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=id,subject,attendees,organizer,start,end&$top=100`
      ) as { value: CalendarEvent[] }

      const events = result.value || []

      // Get the organizer email (the CRM user) to skip them
      let organizerEmail = conn.account_email || ''

      for (const event of events) {
        // Also try to get organizer email from event itself
        const eventOrganizerEmail = event.organizer?.emailAddress?.address?.toLowerCase() || ''
        if (!organizerEmail && eventOrganizerEmail) {
          organizerEmail = eventOrganizerEmail
        }

        const attendees = event.attendees || []

        for (const attendee of attendees) {
          const email = attendee.emailAddress?.address?.toLowerCase() || ''
          const name = attendee.emailAddress?.name || ''

          // Skip organizer (they are the CRM user)
          if (!email || email === organizerEmail.toLowerCase()) {
            totalSkipped++
            continue
          }

          const externalId = `meeting:${event.id}:${email}`

          // Dedup: check lead_import_log
          const { data: existing } = await supabase
            .from('lead_import_log')
            .select('id')
            .eq('source', 'outlook')
            .eq('external_id', externalId)
            .single()

          if (existing) {
            totalSkipped++
            continue
          }

          // Check if email already exists as a lead
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('email', email)
            .is('deleted_at', null)
            .single()

          if (existingLead) {
            // Log to prevent re-checking
            await supabase.from('lead_import_log').insert({
              lead_id: existingLead.id,
              source: 'outlook',
              external_id: externalId,
              metadata: { type: 'meeting_attendee_existing', meeting_subject: event.subject },
              imported_by: conn.employee_id,
            })
            totalSkipped++
            continue
          }

          // Create lead
          const { data: lead, error: leadErr } = await supabase
            .from('leads')
            .insert({
              business_name: name || email,
              contact_person: name || null,
              email: email || null,
              source: 'meeting',
              external_source: 'outlook',
              external_id: externalId,
              external_metadata: { meeting_subject: event.subject, meeting_id: event.id },
              notes: `Auto-imported from Outlook meeting: ${event.subject || 'Untitled'}`,
              is_active: true,
              created_by: conn.employee_id,
            })
            .select('id')
            .single()

          if (leadErr) continue

          // Log import for dedup
          await supabase.from('lead_import_log').insert({
            lead_id: lead.id,
            source: 'outlook',
            external_id: externalId,
            metadata: { type: 'meeting_attendee_cron', meeting_subject: event.subject },
            imported_by: conn.employee_id,
          })

          totalImported++
        }
      }
    } catch (err) {
      console.error(`Cron: Failed to sync meetings for connection ${conn.id}:`, err)
    }
  }

  // Log summary activity
  if (totalImported > 0) {
    await supabase.from('activity_log').insert({
      employee_id: null,
      action: 'leads_imported',
      entity_type: 'cron',
      entity_id: 'sync-outlook-meetings',
      description: `Cron: Auto-imported ${totalImported} leads from Outlook meetings (${totalSkipped} skipped) across ${connections.length} connections`,
    })
  }

  return NextResponse.json({
    success: true,
    data: { connections: connections.length, imported: totalImported, skipped: totalSkipped },
  })
}
