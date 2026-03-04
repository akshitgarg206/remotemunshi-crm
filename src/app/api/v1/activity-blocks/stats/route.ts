import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const url = new URL(req.url)
  const date = url.searchParams.get('date')
  const targetEmployeeId = url.searchParams.get('employee_id') || employeeId

  let query = supabase
    .from('v_activity_block_daily_stats')
    .select('*')
    .eq('employee_id', targetEmployeeId)

  if (date) {
    query = query.eq('block_date', date)
  }

  query = query.order('block_date', { ascending: false })

  const { data, error } = await query
  if (error) throw error

  return NextResponse.json({ success: true, data })
})
