import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const { data, error } = await supabase
    .from('activity_blocks')
    .select('*')
    .eq('employee_id', employeeId)
    .order('block_end', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

  return NextResponse.json({ success: true, data: data || null })
})
