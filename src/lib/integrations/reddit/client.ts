import { encrypt, decrypt } from '../encryption'

const CLIENT_ID = process.env.REDDIT_CLIENT_ID || ''
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.REDDIT_REDIRECT_URI || ''
const SCOPES = 'identity read privatemessages history'
const USER_AGENT = 'web:remotemunshi-crm:v1.0 (by /u/remotemunshi)'

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    state,
    redirect_uri: REDIRECT_URI,
    duration: 'permanent',
    scope: SCOPES,
  })
  return `https://www.reddit.com/api/v1/authorize?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
}> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!res.ok) throw new Error('Reddit token exchange failed')
  return res.json()
}

export async function refreshAccessToken(refreshTokenEncrypted: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const refreshToken = decrypt(refreshTokenEncrypted)
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) throw new Error('Reddit token refresh failed')
  const data = await res.json()
  // Reddit doesn't always return a new refresh_token
  return { ...data, refresh_token: data.refresh_token || refreshToken }
}

export async function callReddit(accessTokenEncrypted: string, endpoint: string): Promise<unknown> {
  const accessToken = decrypt(accessTokenEncrypted)

  const res = await fetch(`https://oauth.reddit.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Reddit API error: ${res.status} ${err}`)
  }

  return res.json()
}

export async function callRedditWithRefresh(
  supabase: any,
  connectionId: string,
  accessTokenEncrypted: string,
  refreshTokenEncrypted: string,
  tokenExpiresAt: string | null,
  endpoint: string,
): Promise<unknown> {
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

      return callReddit(newAccessEncrypted, endpoint)
    } catch {
      await supabase
        .from('integration_connections')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', connectionId)
      throw new Error('Reddit token expired. Please reconnect.')
    }
  }

  return callReddit(accessTokenEncrypted, endpoint)
}

export { encrypt }
