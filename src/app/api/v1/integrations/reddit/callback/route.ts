import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, callReddit, encrypt } from '@/lib/integrations/reddit/client'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    const stateB64 = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(new URL(`/settings/reddit?error=${error}`, req.url))
    if (!code || !stateB64) return NextResponse.redirect(new URL('/settings/reddit?error=missing_params', req.url))

    const state = JSON.parse(Buffer.from(stateB64, 'base64url').toString())
    const employeeId = state.employeeId

    const tokens = await exchangeCodeForTokens(code)
    const accessEncrypted = encrypt(tokens.access_token)
    const refreshEncrypted = encrypt(tokens.refresh_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Get Reddit username
    const profile = await callReddit(accessEncrypted, '/api/v1/me') as { name?: string }

    const supabase = await createServerSupabaseClient()

    await supabase
      .from('integration_connections')
      .upsert({
        employee_id: employeeId,
        provider: 'reddit',
        status: 'connected',
        access_token_encrypted: accessEncrypted,
        refresh_token_encrypted: refreshEncrypted,
        token_expires_at: expiresAt,
        scopes: tokens.scope.split(' '),
        account_name: profile.name || '',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'employee_id,provider' })

    return NextResponse.redirect(new URL('/settings/reddit?success=connected', req.url))
  } catch (err) {
    console.error('Reddit OAuth callback error:', err)
    return NextResponse.redirect(new URL('/settings/reddit?error=auth_failed', req.url))
  }
}
