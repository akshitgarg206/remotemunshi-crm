import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const REMEMBER_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Fallback: if Supabase redirects to root with ?code= (Site URL misconfiguration),
  // forward to the portal callback route so the code gets exchanged properly
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const callbackUrl = new URL('/portal/auth/callback', request.url)
    callbackUrl.search = request.nextUrl.search
    return NextResponse.redirect(callbackUrl)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if this is a portal user with "remember me" enabled
  const isPortalRemember = request.cookies.get('portal_remember')?.value === '1'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Extend cookie lifetime for portal users with "remember me"
              ...(isPortalRemember ? { maxAge: REMEMBER_MAX_AGE } : {}),
            })
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require auth
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/api/v1') ||
    pathname.startsWith('/auth') ||
    pathname === '/portal/login' ||
    pathname === '/portal/auth/callback'

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    // Portal routes redirect to portal login, everything else to employee login
    url.pathname = pathname.startsWith('/portal') ? '/portal/login' : '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
