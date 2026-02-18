import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { getGraphWithAutoRefresh } from '@/lib/integrations/outlook/client'
import { logActivity } from '@/lib/api/log-activity'

// GET — fetch Outlook contacts via Graph API
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
    conn.token_expires_at, '/me/contacts?$top=100&$select=displayName,companyName,emailAddresses,mobilePhone,businessPhones,jobTitle'
  ) as { value: unknown[] }

  return NextResponse.json({ success: true, data: result.value || [] })
}, { requireAuth: true })

// POST — import selected contacts as leads
export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const { contacts } = await req.json() as { contacts: Record<string, unknown>[] }
  if (!contacts?.length) {
    return NextResponse.json({ success: false, error: { code: 'NO_DATA', message: 'No contacts to import' } }, { status: 400 })
  }

  const imported: string[] = []
  const skipped: string[] = []

  for (const contact of contacts) {
    const externalId = (contact.id as string) || ''

    // Check dedup
    const { data: existing } = await supabase
      .from('lead_import_log')
      .select('id')
      .eq('source', 'outlook')
      .eq('external_id', externalId)
      .single()

    if (existing) {
      skipped.push(externalId)
      continue
    }

    const emails = (contact.emailAddresses as { address: string }[]) || []
    const leadData = {
      business_name: (contact.companyName as string) || (contact.displayName as string) || 'Unknown',
      contact_person: contact.displayName as string || null,
      email: emails[0]?.address || null,
      contact_no: (contact.mobilePhone as string) || ((contact.businessPhones as string[]) || [])[0] || null,
      source: 'outlook',
      external_source: 'outlook',
      external_id: externalId,
      external_metadata: { outlook_contact: contact },
      notes: contact.jobTitle ? `Position: ${contact.jobTitle}` : null,
      created_by: employeeId,
    }

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert(leadData)
      .select('id')
      .single()

    if (leadErr) continue

    // Log import
    await supabase.from('lead_import_log').insert({
      lead_id: lead.id,
      source: 'outlook',
      external_id: externalId,
      metadata: { type: 'contact', display_name: contact.displayName },
      imported_by: employeeId,
    })

    imported.push(lead.id)
  }

  await logActivity(supabase, {
    employeeId,
    action: 'leads_imported',
    entityType: 'integration',
    entityId: 'outlook',
    description: `Imported ${imported.length} leads from Outlook contacts (${skipped.length} skipped)`,
  })

  return NextResponse.json({
    success: true,
    data: { imported: imported.length, skipped: skipped.length },
  })
}, { requirePermission: { module: 'leads', action: 'create' } })
