'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Webhook,
  Plus,
  Copy,
  Check,
  Pencil,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookEntry {
  id: string
  url: string
  secret_preview: string | null
  events: string[]
  is_active: boolean
  created_at: string
}

interface CreatedWebhookResponse {
  id: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
}

const ALL_EVENTS = [
  'client.created',
  'client.updated',
  'task.created',
  'task.status_changed',
  'invoice.created',
  'invoice.paid',
  'lead.created',
  'lead.converted',
  'compliance.overdue',
  'dsc.expiring',
] as const

type WebhookEvent = (typeof ALL_EVENTS)[number]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WebhooksPage() {
  const queryClient = useQueryClient()

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([])

  // Secret shown once after creation
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // ---- Queries / Mutations --------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'webhooks'],
    queryFn: () => apiFetch<WebhookEntry[]>('/api/v1/settings/webhooks'),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { url: string; events: string[] }) =>
      apiFetch<CreatedWebhookResponse>('/api/v1/settings/webhooks', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'webhooks'] })
      toast.success('Webhook created')
      setGeneratedSecret(res.data?.secret ?? null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      url?: string
      events?: string[]
      is_active?: boolean
    }) =>
      apiFetch(`/api/v1/settings/webhooks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'webhooks'] })
      toast.success('Webhook updated')
      resetDialog()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/settings/webhooks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'webhooks'] })
      toast.success('Webhook deleted')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ---- Handlers -------------------------------------------------------------

  function toggleEvent(event: WebhookEvent) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  function handleToggleActive(webhook: WebhookEntry) {
    updateMutation.mutate({ id: webhook.id, is_active: !webhook.is_active })
  }

  function openEditDialog(webhook: WebhookEntry) {
    setEditingId(webhook.id)
    setUrl(webhook.url)
    setSelectedEvents(webhook.events as WebhookEvent[])
    setDialogOpen(true)
  }

  function handleSave() {
    if (!url.trim()) {
      toast.error('URL is required')
      return
    }
    if (selectedEvents.length === 0) {
      toast.error('Select at least one event')
      return
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        url: url.trim(),
        events: selectedEvents,
      })
    } else {
      createMutation.mutate({ url: url.trim(), events: selectedEvents })
    }
  }

  function resetDialog() {
    setDialogOpen(false)
    setEditingId(null)
    setUrl('')
    setSelectedEvents([])
    setGeneratedSecret(null)
    setCopied(false)
  }

  function copySecret() {
    if (!generatedSecret) return
    navigator.clipboard.writeText(generatedSecret)
    setCopied(true)
    toast.success('Secret copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  // ---- Derived --------------------------------------------------------------

  const webhooks = (data?.data ?? []) as WebhookEntry[]

  // ---- Render ---------------------------------------------------------------

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
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Send real-time event notifications to external services
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4" />
            Configured Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Webhook className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No webhooks configured. Add one to start receiving events.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell>
                      <code className="text-xs break-all">{wh.url}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {wh.events.slice(0, 3).map((ev) => (
                          <Badge key={ev} variant="secondary" className="text-xs">
                            {ev}
                          </Badge>
                        ))}
                        {wh.events.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{wh.events.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={wh.is_active}
                          onCheckedChange={() => handleToggleActive(wh)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {wh.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/settings/webhooks/${wh.id}/deliveries`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(wh)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(wh.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* ---- Add / Edit Dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {generatedSecret
                ? 'Webhook Created'
                : editingId
                  ? 'Edit Webhook'
                  : 'Add Webhook'}
            </DialogTitle>
          </DialogHeader>

          {generatedSecret ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 font-medium">
                    Copy this signing secret now. You won&apos;t be able to see
                    it again.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-muted px-3 py-2 text-sm font-mono border">
                    {generatedSecret}
                  </code>
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={resetDialog}>Done</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {ALL_EVENTS.map((event) => (
                    <label
                      key={event}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingId
                      ? 'Update'
                      : 'Create'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirm Dialog ---- */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove this webhook endpoint. No further events
            will be delivered to it.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Webhook'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
