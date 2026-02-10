'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { toast } from 'sonner'
import { ArrowLeft, Phone, Trash2, Star, Unplug, RefreshCw, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useWhatsAppAccounts,
  useCreateWhatsAppAccount,
  useUpdateWhatsAppAccount,
  useDeleteWhatsAppAccount,
  useExchangeWhatsAppToken,
  type WhatsAppAccount,
} from '@/hooks/queries/use-whatsapp-accounts'

// Extend Window for Meta SDK
declare global {
  interface Window {
    fbAsyncInit: () => void
    FB: {
      init: (params: Record<string, unknown>) => void
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        params: Record<string, unknown>
      ) => void
    }
  }
}

export default function WhatsAppSettingsPage() {
  const { data, isLoading } = useWhatsAppAccounts()
  const accounts = (data?.data as WhatsAppAccount[] | undefined) || []

  const createAccount = useCreateWhatsAppAccount()
  const updateAccount = useUpdateWhatsAppAccount()
  const deleteAccount = useDeleteWhatsAppAccount()
  const exchangeToken = useExchangeWhatsAppToken()

  const [sdkReady, setSdkReady] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const appId = process.env.NEXT_PUBLIC_META_APP_ID

  // Initialize Meta SDK
  useEffect(() => {
    window.fbAsyncInit = () => {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      })
      setSdkReady(true)
    }
  }, [appId])

  // Handle Embedded Signup callback
  const handleConnectWhatsApp = useCallback(() => {
    if (!window.FB) {
      toast.error('Meta SDK not loaded yet. Please try again.')
      return
    }

    setConnecting(true)

    window.FB.login(
      async (response) => {
        try {
          const code = response.authResponse?.code
          if (!code) {
            toast.error('Connection cancelled or failed')
            setConnecting(false)
            return
          }

          // The Embedded Signup returns phone_number_id and waba_id in the
          // session info extras. We read them from the popup's postMessage.
          // For now, prompt user or extract from the response.
          // Meta's Embedded Signup v2 passes these via the callback.

          // We need to listen for the message event from the popup
          toast.info('Processing connection...')

          // Exchange code for token — the phone_number_id and waba_id
          // come from the embedded signup session_info_extras
          // For the flow: we'll handle this via the message event listener below
        } catch (err) {
          console.error('WhatsApp connection error:', err)
          toast.error('Failed to connect WhatsApp')
        } finally {
          setConnecting(false)
        }
      },
      {
        config_id: '', // Will be set from Meta dashboard
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      }
    )
  }, [])

  // Listen for Embedded Signup message events
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') return

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data.type !== 'WA_EMBEDDED_SIGNUP') return

        const { phone_number_id, waba_id } = data.data || {}
        if (!phone_number_id || !waba_id) return

        // Get the code from the FB.login response
        // The code should already be available from the login callback
        toast.info('Exchanging credentials...')

        // We use a two-step approach:
        // 1. User triggers FB.login (gets code)
        // 2. Embedded Signup sends phone_number_id + waba_id via postMessage
        // 3. We exchange code for token and save

        // Store the signup data for the login callback to use
        window.__waSignupData = { phone_number_id, waba_id }
      } catch {
        // Not a JSON message from Meta, ignore
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Complete signup flow with code + signup data
  const completeSignup = useCallback(async (code: string, phoneNumberId: string, wabaId: string) => {
    try {
      setConnecting(true)

      // Exchange code for permanent token
      const result = await exchangeToken.mutateAsync({
        code,
        phone_number_id: phoneNumberId,
        waba_id: wabaId,
      })

      const tokenData = result.data as Record<string, string>

      // Save account
      await createAccount.mutateAsync({
        phone_number_id: tokenData.phone_number_id,
        waba_id: tokenData.waba_id,
        access_token: tokenData.access_token,
        display_phone_number: tokenData.display_phone_number,
        business_name: tokenData.business_name,
      })

      toast.success('WhatsApp number connected!')
    } catch (err) {
      console.error('Signup completion error:', err)
      toast.error('Failed to complete WhatsApp setup')
    } finally {
      setConnecting(false)
    }
  }, [exchangeToken, createAccount])

  const handleSetDefault = (id: string) => {
    updateAccount.mutate(
      { id, data: { is_default: true } },
      {
        onSuccess: () => toast.success('Default number updated'),
        onError: () => toast.error('Failed to update default'),
      }
    )
  }

  const handleDisconnect = (id: string) => {
    updateAccount.mutate(
      { id, data: { status: 'disconnected' } },
      {
        onSuccess: () => toast.success('Number disconnected'),
        onError: () => toast.error('Failed to disconnect'),
      }
    )
  }

  const handleReconnect = (id: string) => {
    updateAccount.mutate(
      { id, data: { status: 'active' } },
      {
        onSuccess: () => toast.success('Number reconnected'),
        onError: () => toast.error('Failed to reconnect'),
      }
    )
  }

  const handleDelete = (id: string) => {
    if (!confirm('Remove this WhatsApp number? Existing conversations will be preserved but no new messages will be sent or received.')) return
    deleteAccount.mutate(id, {
      onSuccess: () => toast.success('Account removed'),
      onError: () => toast.error('Failed to remove account'),
    })
  }

  return (
    <div className="space-y-6">
      {/* Meta SDK */}
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
        async
        defer
        crossOrigin="anonymous"
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Business</h1>
          <p className="text-muted-foreground text-sm">Connect and manage WhatsApp Business numbers</p>
        </div>
        <Button onClick={handleConnectWhatsApp} disabled={connecting || !appId}>
          {connecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Connect WhatsApp
            </>
          )}
        </Button>
      </div>

      {!appId && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <strong>Setup required:</strong> Set <code>NEXT_PUBLIC_META_APP_ID</code>,{' '}
              <code>META_APP_SECRET</code>, and <code>WHATSAPP_WEBHOOK_VERIFY_TOKEN</code> in your environment variables.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Numbers</CardTitle>
          <CardDescription>
            {accounts.length
              ? `${accounts.length} number${accounts.length > 1 ? 's' : ''} connected`
              : 'No WhatsApp numbers connected yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !accounts.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No WhatsApp numbers connected.</p>
              <p className="text-sm mt-1">
                Click &ldquo;Connect WhatsApp&rdquo; to add your first number via Meta Embedded Signup.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium font-mono">
                      {account.display_phone_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.business_name || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {account.is_default && (
                        <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!account.is_default && account.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Set as default"
                            onClick={() => handleSetDefault(account.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        {account.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Disconnect"
                            onClick={() => handleDisconnect(account.id)}
                          >
                            <Unplug className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reconnect"
                            onClick={() => handleReconnect(account.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Remove"
                          onClick={() => handleDelete(account.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>Configure this in your Meta App Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Callback URL</p>
            <code className="block text-sm bg-muted px-3 py-2 rounded-md">
              {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}
              /api/v1/webhooks/whatsapp
            </code>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Subscribed Fields</p>
            <p className="text-sm text-muted-foreground">messages</p>
          </div>
          <p className="text-xs text-muted-foreground">
            The Verify Token is configured server-side via the <code>WHATSAPP_WEBHOOK_VERIFY_TOKEN</code> env var.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}

// Extend window for signup data passing
declare global {
  interface Window {
    __waSignupData?: { phone_number_id: string; waba_id: string }
  }
}
