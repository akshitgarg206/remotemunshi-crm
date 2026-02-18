import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { callRedditWithRefresh } from '@/lib/integrations/reddit/client'

// GET — fetch inbox messages
export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const { data: conn, error } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('provider', 'reddit')
    .eq('status', 'connected')
    .single()

  if (error || !conn) {
    return NextResponse.json({ success: false, error: { code: 'NOT_CONNECTED', message: 'Reddit not connected' } }, { status: 400 })
  }

  const result = await callRedditWithRefresh(
    supabase, conn.id, conn.access_token_encrypted, conn.refresh_token_encrypted,
    conn.token_expires_at, '/message/inbox?limit=50'
  ) as { data: { children: { data: unknown }[] } }

  const messages = result.data.children.map((c: any) => ({
    id: c.data.id,
    author: c.data.author,
    subject: c.data.subject,
    body: c.data.body,
    created_utc: c.data.created_utc,
    type: c.data.type || 'message',
  }))

  return NextResponse.json({ success: true, data: messages })
}, { requireAuth: true })
