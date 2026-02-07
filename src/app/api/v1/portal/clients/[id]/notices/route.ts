import { NextResponse } from 'next/server'
import { portalHandler } from '@/lib/api/portal-handler'

export const GET = portalHandler(async (req, { supabase, clientIds, params }) => {
  const { id } = params

  if (!clientIds.includes(id)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('notices')
    .select('id, section, assessment_year, date_of_issue, date_of_receipt, due_date, response_date, status, remarks, created_at, notice_types:notice_type_id(name)')
    .eq('client_id', id)
    .is('deleted_at', null)
    .order('date_of_issue', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'QUERY_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
})
