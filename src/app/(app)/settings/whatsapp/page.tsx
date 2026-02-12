'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Phone, Trash2, Star, Unplug, RefreshCw, Loader2, Plus, CheckCircle2, XCircle, Copy, Download } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  useWhatsAppSetup,
  useCreateWhatsAppAccount,
  useUpdateWhatsAppAccount,
  useDeleteWhatsAppAccount,
  type WhatsAppAccount,
} from '@/hooks/queries/use-whatsapp-accounts'

export default function WhatsAppSettingsPage() {
  const { data, isLoading } = useWhatsAppAccounts()
  const accounts = (data?.data as WhatsAppAccount[] | undefined) || []

  const { data: setupData } = useWhatsAppSetup()
  const setup = setupData?.data as { connected: boolean; pluginId: string | null; message?: string } | undefined

  const createAccount = useCreateWhatsAppAccount()
  const updateAccount = useUpdateWhatsAppAccount()
  const deleteAccount = useDeleteWhatsAppAccount()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    phone_number_id: '',
    display_phone_number: '',
    business_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.phone_number_id || !form.display_phone_number) {
      toast.error('Please fill in Phone Number ID and Phone Number')
      return
    }

    createAccount.mutate(
      {
        phone_number_id: form.phone_number_id.trim(),
        display_phone_number: form.display_phone_number.trim(),
        business_name: form.business_name.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('WhatsApp number connected!')
          setShowForm(false)
          setForm({ phone_number_id: '', display_phone_number: '', business_name: '' })
        },
        onError: (err) => {
          const msg = (err as Error).message || 'Failed to save account'
          toast.error(msg.includes('DUPLICATE') ? 'This phone number is already connected' : msg)
        },
      }
    )
  }

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

  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    chats_imported: number; messages_imported: number; contacts_created: number; errors: string[]
  } | null>(null)

  const handleSyncHistory = async () => {
    if (!confirm('Import all WhatsApp chat history from ChakraHQ? This may take a few minutes.')) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/v1/whatsapp/sync-history', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setSyncResult(json.data)
        toast.success(`Imported ${json.data.chats_imported} chats, ${json.data.messages_imported} messages`)
      } else {
        toast.error(json.error?.message || 'Sync failed')
      }
    } catch {
      toast.error('Sync request failed')
    } finally {
      setSyncing(false)
    }
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1/webhooks/whatsapp`
    : 'https://your-domain.com/api/v1/webhooks/whatsapp'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Business</h1>
          <p className="text-muted-foreground text-sm">Manage WhatsApp via ChakraHQ coexistence</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Number
          </Button>
        )}
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ChakraHQ Connection
            {setup?.connected ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            WhatsApp coexistence powered by ChakraHQ pass-through API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {setup?.connected ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Plugin ID</p>
                <p className="text-sm font-mono">{setup.pluginId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-sm text-green-600 dark:text-green-400">Active &mdash; API credentials configured</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set <code className="bg-muted px-1.5 py-0.5 rounded text-xs">CHAKRA_PLUGIN_ID</code> and{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">CHAKRA_ACCESS_TOKEN</code> environment variables to connect.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Number Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add WhatsApp Number</CardTitle>
            <CardDescription>
              Find these in your ChakraHQ WhatsApp Setup page. Click the gear icon next to &ldquo;WhatsApp Phone Numbers&rdquo; to see the Meta Phone Number ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone_number_id">Phone Number ID (Meta) *</Label>
                  <Input
                    id="phone_number_id"
                    placeholder="e.g. 123456789012345"
                    value={form.phone_number_id}
                    onChange={(e) => setForm((f) => ({ ...f, phone_number_id: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    ChakraHQ &gt; WhatsApp Setup &gt; Gear icon &gt; Meta ID column
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_phone_number">Phone Number *</Label>
                  <Input
                    id="display_phone_number"
                    placeholder="e.g. +91 78887 80264"
                    value={form.display_phone_number}
                    onChange={(e) => setForm((f) => ({ ...f, display_phone_number: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  placeholder="e.g. Remote Munshi"
                  value={form.business_name}
                  onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createAccount.isPending}>
                  {createAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
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
                Click &ldquo;Add Number&rdquo; to register your WhatsApp Business number.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Phone Number ID</TableHead>
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
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {account.phone_number_id}
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

      {/* Sync Chat History */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chat History</CardTitle>
            <CardDescription>
              Import existing WhatsApp conversations from ChakraHQ into OmniDesk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button onClick={handleSyncHistory} disabled={syncing} variant="outline">
                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {syncing ? 'Syncing...' : 'Import Chat History'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Pulls all chats &amp; messages from ChakraHQ. Safe to run multiple times — duplicates are skipped.
              </p>
            </div>
            {syncResult && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
                <p><strong>{syncResult.chats_imported}</strong> conversations imported</p>
                <p><strong>{syncResult.messages_imported}</strong> messages imported</p>
                <p><strong>{syncResult.contacts_created}</strong> new contacts created</p>
                {syncResult.errors.length > 0 && (
                  <div className="mt-2 text-destructive">
                    <p className="font-medium">{syncResult.errors.length} errors:</p>
                    {syncResult.errors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-xs">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Configure this in your ChakraHQ WhatsApp Setup &gt; More tab &gt; &ldquo;Pass-through webhook URL for Meta events&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Webhook URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md break-all">
                {webhookUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl)}
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Setup Steps</p>
            <ol className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1 list-decimal list-inside">
              <li>Open ChakraHQ &gt; WhatsApp Setup &gt; <strong>More</strong> tab</li>
              <li>Paste the URL above into &ldquo;Pass-through webhook URL for Meta events&rdquo;</li>
              <li>Click <strong>Save</strong> (top right)</li>
              <li>Messages sent to your WhatsApp number will now appear in OmniDesk</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
