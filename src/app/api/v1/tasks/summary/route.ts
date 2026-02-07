import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase }) => {
  const { data, error } = await supabase
    .from('v_task_summary')
    .select('*')
    .order('employee_name', { ascending: true })

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'tasks', action: 'read' } })
