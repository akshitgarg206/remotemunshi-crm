import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase, userId }) => {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: employee } = await supabase
    .from('employees')
    .select('*, roles(id, name), departments(id, name), designations(id, name)')
    .eq('auth_user_id', user?.id ?? '')
    .single()

  return NextResponse.json({
    success: true,
    data: { user, employee },
  })
})
