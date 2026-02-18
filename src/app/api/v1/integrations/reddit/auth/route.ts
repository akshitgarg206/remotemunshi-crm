import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { getAuthorizationUrl } from '@/lib/integrations/reddit/client'

export const GET = apiHandler(async (req, { employeeId }) => {
  if (!employeeId) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 })
  }
  const state = Buffer.from(JSON.stringify({ employeeId })).toString('base64url')
  const url = getAuthorizationUrl(state)
  return NextResponse.redirect(url)
}, { requireAuth: true })
