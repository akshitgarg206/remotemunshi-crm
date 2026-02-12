import { NextResponse } from 'next/server'

/**
 * Deprecated — Token exchange was for Meta Embedded Signup flow.
 * Now using ChakraHQ pass-through API (tokens managed via env vars).
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: { code: 'DEPRECATED', message: 'Token exchange not needed with ChakraHQ. Credentials are managed via environment variables.' } },
    { status: 410 }
  )
}
