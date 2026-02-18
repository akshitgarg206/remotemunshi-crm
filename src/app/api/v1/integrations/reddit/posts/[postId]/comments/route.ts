import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { callRedditWithRefresh } from '@/lib/integrations/reddit/client'

// GET — fetch comments on a specific post
export const GET = apiHandler(async (req, { params, supabase, employeeId }) => {
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
    conn.token_expires_at, `/comments/${params.postId}?limit=100&sort=new`
  ) as unknown[]

  // Reddit returns [post, comments] array
  const commentsListing = (result[1] as any)?.data?.children || []
  const comments = commentsListing
    .filter((c: any) => c.kind === 't1')
    .map((c: any) => ({
      id: c.data.id,
      author: c.data.author,
      body: c.data.body,
      score: c.data.score,
      created_utc: c.data.created_utc,
      permalink: `https://reddit.com${c.data.permalink}`,
    }))

  return NextResponse.json({ success: true, data: comments })
}, { requireAuth: true })
