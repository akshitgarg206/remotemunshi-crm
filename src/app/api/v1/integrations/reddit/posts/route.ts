import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { callRedditWithRefresh } from '@/lib/integrations/reddit/client'

// GET — list user's own Reddit posts
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
    conn.token_expires_at, `/user/${conn.account_name}/submitted?limit=50&sort=new`
  ) as { data: { children: { data: unknown }[] } }

  const posts = result.data.children.map((c: any) => ({
    id: c.data.id,
    title: c.data.title,
    subreddit: c.data.subreddit_name_prefixed,
    num_comments: c.data.num_comments,
    score: c.data.score,
    created_utc: c.data.created_utc,
    url: c.data.url,
    permalink: `https://reddit.com${c.data.permalink}`,
  }))

  return NextResponse.json({ success: true, data: posts })
}, { requireAuth: true })
