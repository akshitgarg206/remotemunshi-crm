import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

// GET — connection status for current employee
export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const { data, error } = await supabase
    .from('integration_connections')
    .select('id, status, account_email, account_name, last_synced_at, created_at')
    .eq('employee_id', employeeId)
    .eq('provider', 'outlook')
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
      account_email: data.account_email,
      account_name: data.account_name,
      last_synced_at: data.last_synced_at,
      connected_at: data.created_at,
    },
  })
}, { requireAuth: true })
