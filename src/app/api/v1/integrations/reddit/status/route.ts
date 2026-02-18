import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const { data, error } = await supabase
    .from('integration_connections')
    .select('id, status, account_name, last_synced_at, created_at')
    .eq('employee_id', employeeId)
    .eq('provider', 'reddit')
    .single()

  if (error && error.code === 'PGRST116') {
    return NextResponse.json({ success: true, data: { connected: false } })
  }
  if (error) throw error

  return NextResponse.json({
    success: true,
    data: {
      connected: data.status === 'connected',
      status: data.status,
      username: data.account_name,
      last_synced_at: data.last_synced_at,
    },
  })
}, { requireAuth: true })
