import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const url = new URL(req.url)
  const category = url.searchParams.get('category') || null
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)

  const { data, error } = await supabase.rpc('get_activity_suggestions', {
    p_employee_id: employeeId,
    p_category: category,
    p_limit: limit,
  })

  if (error) throw error

  return NextResponse.json({ success: true, data })
})
