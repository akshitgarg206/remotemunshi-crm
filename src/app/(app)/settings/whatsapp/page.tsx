'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Phone, Trash2, Star, Unplug, RefreshCw, Loader2, Plus, ExternalLink } from 'lucide-react'

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
  useCreateWhatsAppAccount,
  useUpdateWhatsAppAccount,
  useDeleteWhatsAppAccount,
  type WhatsAppAccount,
} from '@/hooks/queries/use-whatsapp-accounts'

export default function WhatsAppSettingsPage() {
  const { data, isLoading } = useWhatsAppAccounts()
  const accounts = (data?.data as WhatsAppAccount[] | undefined) || []

  const createAccount = useCreateWhatsAppAccount()
  const updateAccount = useUpdateWhatsAppAccount()
  const deleteAccount = useDeleteWhatsAppAccount()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    phone_number_id: '',
    waba_id: '',
    access_token: '',
    display_phone_number: '',
    business_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.phone_number_id || !form.waba_id || !form.access_token || !form.display_phone_number) {
      toast.error('Please fill in all required fields')
      return
    }

    createAccount.mutate(
      {
        phone_number_id: form.phone_number_id.trim(),
        waba_id: form.waba_id.trim(),
        access_token: form.access_token.trim(),
        display_phone_number: form.display_phone_number.trim(),
        business_name: form.business_name.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('WhatsApp number connected!')
          setShowForm(false)
          setForm({ phone_number_id: '', waba_id: '', access_token: '', display_phone_number: '', business_name: '' })
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
          <p className="text-muted-foreground text-sm">Connect and manage WhatsApp Business numbers</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Number
          </Button>
        )}
      </div>

      {/* Add Number Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Connect WhatsApp Number</CardTitle>
            <CardDescription>
              Enter credentials from your{' '}
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 inline-flex items-center gap-1"
              >
                Meta App Dashboard <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone_number_id">Phone Number ID *</Label>
                  <Input
                    id="phone_number_id"
                    placeholder="e.g. 123456789012345"
                    value={form.phone_number_id}
                    onChange={(e) => setForm((f) => ({ ...f, phone_number_id: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">WhatsApp &gt; API Setup &gt; Phone number ID</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waba_id">WABA ID *</Label>
                  <Input
                    id="waba_id"
                    placeholder="e.g. 109876543210123"
                    value={form.waba_id}
                    onChange={(e) => setForm((f) => ({ ...f, waba_id: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">WhatsApp &gt; API Setup &gt; WhatsApp Business Account ID</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_phone_number">Phone Number *</Label>
                  <Input
                    id="display_phone_number"
                    placeholder="e.g. +91 98765 43210"
                    value={form.display_phone_number}
                    onChange={(e) => setForm((f) => ({ ...f, display_phone_number: e.target.value }))}
                  />
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="access_token">Permanent Access Token *</Label>
                <Input
                  id="access_token"
                  type="password"
                  placeholder="System user access token"
                  value={form.access_token}
                  onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Business Settings &gt; System Users &gt; Generate Token (with whatsapp_business_messaging + whatsapp_business_management permissions)
                </p>
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
                Click &ldquo;Add Number&rdquo; to connect your WhatsApp Business number.
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
