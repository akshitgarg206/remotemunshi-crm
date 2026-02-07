'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Building2, LogOut, LayoutDashboard } from 'lucide-react'

const publicPaths = ['/portal/login', '/portal/auth/callback']

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [contactName, setContactName] = useState<string>('')
  const isPublicPage = publicPaths.includes(pathname)

  useEffect(() => {
    if (isPublicPage) return

    // Fetch portal identity
    fetch('/api/v1/portal/auth/me')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setContactName(res.data.contact?.name ?? '')
        } else {
          router.push('/portal/login')
        }
      })
      .catch(() => router.push('/portal/login'))
  }, [isPublicPage, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Clear the remember-me cookie
    document.cookie = 'portal_remember=; path=/; max-age=0'
    router.push('/portal/login')
    router.refresh()
  }

  // Public pages (login, callback) get a minimal layout
  if (isPublicPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md px-4">{children}</div>
      </div>
    )
  }

  // Authenticated portal layout
  return (
    <div className="min-h-screen bg-background">
      {/* Portal Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              RM
            </div>
            <span className="font-semibold text-sm">Client Portal</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/portal/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            {contactName && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                <Building2 className="mr-1 inline h-3.5 w-3.5" />
                {contactName}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Portal Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
