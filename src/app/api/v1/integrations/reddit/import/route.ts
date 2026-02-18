import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { logActivity } from '@/lib/api/log-activity'

// POST — import selected commenters/messagers as leads
export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const { items } = await req.json() as {
    items: { type: 'comment' | 'message'; id: string; author: string; body: string; post_title?: string }[]
  }

  if (!items?.length) {
    return NextResponse.json({ success: false, error: { code: 'NO_DATA', message: 'No items to import' } }, { status: 400 })
  }

  let imported = 0
  let skipped = 0

  for (const item of items) {
    const externalId = `reddit:${item.type}:${item.id}`

    // Dedup
    const { data: existing } = await supabase
      .from('lead_import_log')
      .select('id')
      .eq('source', 'reddit')
      .eq('external_id', externalId)
      .single()

    if (existing) { skipped++; continue }

    const notes = item.type === 'comment'
      ? `Reddit comment on "${item.post_title || 'post'}":\n\n${item.body}`
      : `Reddit message:\n\n${item.body}`

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        business_name: item.author,
        contact_person: item.author,
        source: 'reddit',
        external_source: 'reddit',
        external_id: externalId,
        external_metadata: { reddit_item: item },
        notes,
        created_by: employeeId,
      })
      .select('id')
      .single()

    if (leadErr) continue

    await supabase.from('lead_import_log').insert({
      lead_id: lead.id,
      source: 'reddit',
      external_id: externalId,
      metadata: { type: item.type, author: item.author },
      imported_by: employeeId,
    })

    imported++
  }

  await logActivity(supabase, {
    employeeId,
    action: 'leads_imported',
    entityType: 'integration',
    entityId: 'reddit',
    description: `Imported ${imported} leads from Reddit (${skipped} skipped)`,
  })

  return NextResponse.json({ success: true, data: { imported, skipped } })
}, { requirePermission: { module: 'leads', action: 'create' } })
