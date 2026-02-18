import { encrypt, decrypt } from '../encryption'

const TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common'
const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || ''
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || ''
const SCOPES = 'User.Read Contacts.Read Mail.Read Calendars.Read offline_access'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    response_mode: 'query',
    state,
  })
  return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
}> {
  const res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error_description || 'Token exchange failed')
  }

  return res.json()
}

export async function refreshAccessToken(refreshTokenEncrypted: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const refreshToken = decrypt(refreshTokenEncrypted)

  const res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: SCOPES,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error_description || 'Token refresh failed')
  }

  return res.json()
}

export async function callGraph(accessTokenEncrypted: string, endpoint: string, options?: RequestInit): Promise<unknown> {
  const accessToken = decrypt(accessTokenEncrypted)

  const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Graph API error: ${res.status}`)
  }

  return res.json()
}

export async function getGraphWithAutoRefresh(
  supabase: any,
  connectionId: string,
  accessTokenEncrypted: string,
  refreshTokenEncrypted: string,
  tokenExpiresAt: string | null,
  endpoint: string,
): Promise<unknown> {
  // Check if token is expired
  const isExpired = tokenExpiresAt && new Date(tokenExpiresAt) < new Date()

  if (isExpired) {
    try {
      const tokens = await refreshAccessToken(refreshTokenEncrypted)
      const newAccessEncrypted = encrypt(tokens.access_token)
      const newRefreshEncrypted = encrypt(tokens.refresh_token)
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

      await supabase
        .from('integration_connections')
        .update({
          access_token_encrypted: newAccessEncrypted,
          refresh_token_encrypted: newRefreshEncrypted,
          token_expires_at: expiresAt,
          status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId)

      return callGraph(newAccessEncrypted, endpoint)
    } catch {
      await supabase
        .from('integration_connections')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', connectionId)
      throw new Error('Token refresh failed. Please reconnect your Outlook account.')
    }
  }

  return callGraph(accessTokenEncrypted, endpoint)
}

export { encrypt, decrypt }
