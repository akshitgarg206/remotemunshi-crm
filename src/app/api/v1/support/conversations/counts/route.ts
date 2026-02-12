import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (_req, { supabase }) => {
  const { data, error } = await supabase.rpc('get_conversation_counts')

  if (error) {
    // Fallback: manual query if RPC doesn't exist
    const { data: rows, error: queryError } = await supabase
      .from('support_conversations')
      .select('channel')
      .is('deleted_at', null)
      .eq('is_spam', false)

    if (queryError) throw queryError

    const counts: Record<string, number> = { total: 0 }
    for (const row of rows || []) {
      counts[row.channel] = (counts[row.channel] || 0) + 1
      counts.total++
    }

    return NextResponse.json({ success: true, data: counts })
  }

  // RPC returns array of {channel, count}
  const counts: Record<string, number> = { total: 0 }
  for (const row of data || []) {
    counts[row.channel] = Number(row.count)
    counts.total += Number(row.count)
  }

  return NextResponse.json({ success: true, data: counts })
}, { requirePermission: { module: 'communications', action: 'read' } })
