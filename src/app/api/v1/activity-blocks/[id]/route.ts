import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateActivityBlockSchema } from '@/lib/validators/activity-blocks'

export const GET = apiHandler(async (req, { supabase, params }) => {
  const { data, error } = await supabase
    .from('activity_blocks')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) throw error
  if (!data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Activity block not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
})

export const PUT = apiHandler(async (req, { supabase, employeeId, params }) => {
  const body = await req.json()
  const validated = updateActivityBlockSchema.parse(body)

  const { data, error } = await supabase
    .from('activity_blocks')
    .update(validated)
    .eq('id', params.id)
    .eq('employee_id', employeeId)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
})

export const DELETE = apiHandler(async (req, { supabase, employeeId, params }) => {
  const { error } = await supabase
    .from('activity_blocks')
    .delete()
    .eq('id', params.id)
    .eq('employee_id', employeeId)

  if (error) throw error
  return NextResponse.json({ success: true, data: null })
})
