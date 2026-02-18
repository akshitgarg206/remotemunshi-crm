import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { getGraphWithAutoRefresh } from '@/lib/integrations/outlook/client'

// GET — search emails via Graph API
export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const search = req.nextUrl.searchParams.get('search') || ''
  const top = req.nextUrl.searchParams.get('top') || '25'

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

  let endpoint = `/me/messages?$top=${top}&$select=subject,bodyPreview,from,toRecipients,receivedDateTime,isRead&$orderby=receivedDateTime desc`
  if (search) {
    endpoint += `&$search="${search}"`
  }

  const result = await getGraphWithAutoRefresh(
    supabase, conn.id, conn.access_token_encrypted, conn.refresh_token_encrypted,
    conn.token_expires_at, endpoint
  ) as { value: unknown[] }

  return NextResponse.json({ success: true, data: result.value || [] })
}, { requireAuth: true })

// POST — attach selected emails as lead communications
export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const { emails, lead_id } = await req.json() as { emails: Record<string, unknown>[]; lead_id: string }

  if (!emails?.length || !lead_id) {
    return NextResponse.json({ success: false, error: { code: 'NO_DATA', message: 'Emails and lead_id required' } }, { status: 400 })
  }

  let attached = 0
  for (const email of emails) {
    const from = email.from as { emailAddress?: { address?: string; name?: string } } | undefined
    const to = (email.toRecipients as { emailAddress?: { address?: string } }[]) || []

    await supabase.from('lead_communications').insert({
      lead_id,
      channel: 'email',
      direction: 'inbound',
      subject: email.subject as string || null,
      body: email.bodyPreview as string || null,
      from_contact: from?.emailAddress?.name || from?.emailAddress?.address || null,
      to_contact: to[0]?.emailAddress?.address || null,
      sent_at: email.receivedDateTime as string || new Date().toISOString(),
      employee_id: employeeId,
      metadata: { outlook_message_id: email.id },
    })
    attached++
  }

  return NextResponse.json({ success: true, data: { attached } })
}, { requirePermission: { module: 'leads', action: 'update' } })
