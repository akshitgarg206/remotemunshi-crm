import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

const REMEMBER_MAX_AGE = 60 * 60 * 24 * 90 // 90 days in seconds

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const remember = searchParams.get('remember') === '1'

  if (!code) {
    return NextResponse.redirect(new URL('/portal/login?error=missing_code', origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
            })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/portal/login?error=${encodeURIComponent(error.message)}`, origin)
    )
  }

  // Verify this is a portal contact
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const admin = createAdminClient()
    const { data: contact } = await admin
      .from('contacts')
      .select('id, portal_enabled')
      .eq('auth_user_id', user.id)
      .eq('portal_enabled', true)
      .is('deleted_at', null)
      .single()

    if (!contact) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/portal/login?error=no_portal_access', origin)
      )
    }
  }

  // Set remember-me flag cookie so middleware can preserve maxAge on refresh
  if (remember) {
    cookieStore.set('portal_remember', '1', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REMEMBER_MAX_AGE,
    })
  }

  return NextResponse.redirect(new URL('/portal/dashboard', origin))
}
