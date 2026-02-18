import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  await supabase
    .from('integration_connections')
    .update({ status: 'disconnected', access_token_encrypted: null, refresh_token_encrypted: null, updated_at: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .eq('provider', 'reddit')

  return NextResponse.json({ success: true, data: { disconnected: true } })
}, { requireAuth: true })
