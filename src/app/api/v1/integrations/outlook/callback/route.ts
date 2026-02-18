import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, callGraph, encrypt } from '@/lib/integrations/outlook/client'

// GET — OAuth callback from Microsoft
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    const stateB64 = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/settings/outlook?error=${error}`, req.url))
    }

    if (!code || !stateB64) {
      return NextResponse.redirect(new URL('/settings/outlook?error=missing_params', req.url))
    }

    const state = JSON.parse(Buffer.from(stateB64, 'base64url').toString())
    const employeeId = state.employeeId

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)
    const accessEncrypted = encrypt(tokens.access_token)
    const refreshEncrypted = encrypt(tokens.refresh_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Get user profile from Microsoft Graph
    const profile = await callGraph(accessEncrypted, '/me') as {
      mail?: string; userPrincipalName?: string; displayName?: string
    }

    const supabase = await createServerSupabaseClient()

    // Upsert integration connection
    await supabase
      .from('integration_connections')
      .upsert({
        employee_id: employeeId,
        provider: 'outlook',
        status: 'connected',
        access_token_encrypted: accessEncrypted,
        refresh_token_encrypted: refreshEncrypted,
        token_expires_at: expiresAt,
        scopes: tokens.scope.split(' '),
        account_email: profile.mail || profile.userPrincipalName || '',
        account_name: profile.displayName || '',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'employee_id,provider' })

    return NextResponse.redirect(new URL('/settings/outlook?success=connected', req.url))
  } catch (err) {
    console.error('Outlook OAuth callback error:', err)
    return NextResponse.redirect(new URL('/settings/outlook?error=auth_failed', req.url))
  }
}
