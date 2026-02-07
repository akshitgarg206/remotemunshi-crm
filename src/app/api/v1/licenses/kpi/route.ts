import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase }) => {
  const { data, error } = await supabase.from('v_license_kpis').select('*').single()
  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'licenses', action: 'read' } })
