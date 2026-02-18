import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

// GET /api/v1/leads/:id/activity — reads activity_log where entity_type='lead'
export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, employees(id, name)')
    .eq('entity_type', 'lead')
    .eq('entity_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'leads', action: 'read' } })
