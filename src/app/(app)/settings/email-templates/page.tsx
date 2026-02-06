'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Mail,
  Plus,
  Pencil,
  Trash2,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailTemplate {
  id: string
  name: string
  subject: string
  type: TemplateType
  body: string
  created_at: string
  updated_at: string
}

const TEMPLATE_TYPES = ['invoice', 'task', 'notification', 'welcome'] as const
type TemplateType = (typeof TEMPLATE_TYPES)[number]

const TYPE_COLORS: Record<TemplateType, string> = {
  invoice: 'bg-blue-100 text-blue-700',
  task: 'bg-purple-100 text-purple-700',
  notification: 'bg-yellow-100 text-yellow-700',
  welcome: 'bg-green-100 text-green-700',
}

const AVAILABLE_VARIABLES = [
  '{{client_name}}',
  '{{client_email}}',
  '{{invoice_number}}',
  '{{invoice_amount}}',
  '{{invoice_due_date}}',
  '{{task_name}}',
  '{{task_due_date}}',
  '{{task_assignee}}',
  '{{company_name}}',
  '{{sender_name}}',
  '{{current_date}}',
  '{{portal_link}}',
] as const

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient()

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [type, setType] = useState<TemplateType | ''>('')
  const [body, setBody] = useState('')

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // ---- Queries / Mutations --------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'email-templates'],
    queryFn: () =>
      apiFetch<EmailTemplate[]>('/api/v1/settings/email-templates'),
  })

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string
      subject: string
      type: string
      body: string
    }) =>
      apiFetch<EmailTemplate>('/api/v1/settings/email-templates', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'email-templates'] })
      toast.success('Template created')
      resetDialog()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      name: string
      subject: string
      type: string
      body: string
    }) =>
      apiFetch<EmailTemplate>(`/api/v1/settings/email-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'email-templates'] })
      toast.success('Template updated')
      resetDialog()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/settings/email-templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'email-templates'] })
      toast.success('Template deleted')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ---- Handlers -------------------------------------------------------------

  function openEditDialog(tpl: EmailTemplate) {
    setEditingId(tpl.id)
    setName(tpl.name)
    setSubject(tpl.subject)
    setType(tpl.type)
    setBody(tpl.body)
    setDialogOpen(true)
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!subject.trim()) {
      toast.error('Subject is required')
      return
    }
    if (!type) {
      toast.error('Select a template type')
      return
    }
    if (!body.trim()) {
      toast.error('Body is required')
      return
    }

    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      type,
      body: body.trim(),
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function insertVariable(variable: string) {
    setBody((prev) => prev + variable)
  }

  function resetDialog() {
    setDialogOpen(false)
    setEditingId(null)
    setName('')
    setSubject('')
    setType('')
    setBody('')
  }

  // ---- Derived --------------------------------------------------------------

  const templates = (data?.data ?? []) as EmailTemplate[]

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
          <h1 className="text-2xl font-bold tracking-tight">
            Email Templates
          </h1>
          <p className="text-muted-foreground">
            Create and manage email templates for automated communications
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No email templates yet. Add one to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium">{tpl.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {tpl.subject}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`capitalize ${TYPE_COLORS[tpl.type] ?? ''}`}
                        variant="secondary"
                      >
                        {tpl.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(tpl)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(tpl.id)}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Template' : 'Add Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tpl-name">Name</Label>
                <Input
                  id="tpl-name"
                  placeholder="e.g. Invoice Reminder"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-type">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as TemplateType)}
                >
                  <SelectTrigger id="tpl-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-subject">Subject</Label>
              <Input
                id="tpl-subject"
                placeholder="e.g. Invoice #{{invoice_number}} is due"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-body">Body</Label>
              <Textarea
                id="tpl-body"
                className="min-h-[200px] font-mono text-sm"
                placeholder={`Dear {{client_name}},\n\nThis is a reminder that invoice #{{invoice_number}} for {{invoice_amount}} is due on {{invoice_due_date}}.\n\nPlease process the payment at your earliest convenience.\n\nBest regards,\n{{sender_name}}\n{{company_name}}`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  Available variables (click to insert):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer border"
                    >
                      {v}
                    </button>
                  ))}
                </div>
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
                    ? 'Update Template'
                    : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirm Dialog ---- */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this email template. Any automated
            workflows using it will need to be updated.
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
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
