import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

// GET /api/v1/clients/kpi
export const GET = apiHandler(async (req, { supabase }) => {
  const { data, error } = await supabase
    .from('v_client_kpis')
    .select('*')
    .single()

  if (error) throw error

  return NextResponse.json({ success: true, data })
})
