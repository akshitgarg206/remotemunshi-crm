'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PortalAuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase handles the code exchange automatically via the URL hash/params
        // We just need to check if the session was established
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setErrorMessage(error.message)
          setStatus('error')
          return
        }

        if (session) {
          setStatus('success')
          // Verify this is a portal contact (not an employee)
          const res = await fetch('/api/v1/portal/auth/me')
          const meData = await res.json()

          if (meData.success) {
            setTimeout(() => router.push('/portal/dashboard'), 1000)
          } else {
            setErrorMessage('This account does not have portal access.')
            setStatus('error')
          }
        } else {
          setErrorMessage('Could not establish a session. The link may have expired.')
          setStatus('error')
        }
      } catch {
        setErrorMessage('An unexpected error occurred.')
        setStatus('error')
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <CardTitle>Signing you in...</CardTitle>
            <CardDescription>Please wait while we verify your login link.</CardDescription>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>Redirecting to your dashboard...</CardDescription>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <XCircle className="h-6 w-6" />
            </div>
            <CardTitle>Login failed</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </>
        )}
      </CardHeader>
      {status === 'error' && (
        <CardContent>
          <Button className="w-full" onClick={() => router.push('/portal/login')}>
            Try again
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
