import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

// POST — disconnect Outlook integration
export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const { error } = await supabase
    .from('integration_connections')
    .update({
      status: 'disconnected',
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      updated_at: new Date().toISOString(),
    })
    .eq('employee_id', employeeId)
    .eq('provider', 'outlook')

  if (error) throw error
  return NextResponse.json({ success: true, data: { disconnected: true } })
}, { requireAuth: true })
