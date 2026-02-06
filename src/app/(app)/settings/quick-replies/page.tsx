'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { DataGrid } from '@/components/data-grid/data-grid'
import { useQuickReplies, useCreateQuickReply, useUpdateQuickReply, useDeleteQuickReply } from '@/hooks/queries/use-support-quick-replies'
import { toast } from 'sonner'

const columns = [
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }: { row: { original: Record<string, unknown> } }) => (
      <Badge variant="outline" className="text-xs">{(row.original.category as string) || 'General'}</Badge>
    ),
  },
  {
    accessorKey: 'shortcut',
    header: 'Shortcut',
    cell: ({ row }: { row: { original: Record<string, unknown> } }) =>
      row.original.shortcut ? <code className="text-xs bg-muted px-1 rounded">/{row.original.shortcut as string}</code> : '-',
  },
  {
    accessorKey: 'channel',
    header: 'Channel',
    cell: ({ row }: { row: { original: Record<string, unknown> } }) =>
      (row.original.channel as string) || 'All',
  },
  {
    accessorKey: 'is_global',
    header: 'Scope',
    cell: ({ row }: { row: { original: Record<string, unknown> } }) => (
      <Badge variant={row.original.is_global ? 'default' : 'secondary'} className="text-xs">
        {row.original.is_global ? 'Global' : 'Personal'}
      </Badge>
    ),
  },
]

interface QuickReplyForm {
  title: string
  content: string
  category: string
  shortcut: string
  channel: string
  is_global: boolean
}

const defaultForm: QuickReplyForm = {
  title: '', content: '', category: '', shortcut: '', channel: '', is_global: true,
}

export default function QuickRepliesSettingsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuickReplies({ page, search: search || undefined })
  const createReply = useCreateQuickReply()
  const updateReply = useUpdateQuickReply()
  const deleteReply = useDeleteQuickReply()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<QuickReplyForm>(defaultForm)

  const handleCreate = () => {
    setEditId(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const handleEdit = (row: Record<string, unknown>) => {
    setEditId(row.id as string)
    setForm({
      title: (row.title as string) || '',
      content: (row.content as string) || '',
      category: (row.category as string) || '',
      shortcut: (row.shortcut as string) || '',
      channel: (row.channel as string) || '',
      is_global: row.is_global as boolean ?? true,
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    const payload: Record<string, unknown> = { ...form }
    if (!payload.channel) delete payload.channel

    if (editId) {
      updateReply.mutate(
        { id: editId, data: payload },
        {
          onSuccess: () => { toast.success('Quick reply updated'); setDialogOpen(false) },
          onError: (err) => toast.error(err.message),
        }
      )
    } else {
      createReply.mutate(payload, {
        onSuccess: () => { toast.success('Quick reply created'); setDialogOpen(false) },
        onError: (err) => toast.error(err.message),
      })
    }
  }

  const handleDelete = (id: string) => {
    deleteReply.mutate(id, {
      onSuccess: () => toast.success('Quick reply deleted'),
      onError: (err) => toast.error(err.message),
    })
  }

  const actionsColumn = {
    id: 'actions',
    header: '',
    cell: ({ row }: { row: { original: Record<string, unknown> } }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(row.original)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDelete(row.original.id as string)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quick Replies</h1>
          <p className="text-sm text-muted-foreground">Manage reusable response templates for OmniDesk</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Quick Reply
        </Button>
      </div>

      <DataGrid
        columns={[...columns, actionsColumn]}
        data={(data?.data || []) as Record<string, unknown>[]}
        isLoading={isLoading}
        page={page}
        pageCount={data?.meta?.totalPages}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
        onSearch={setSearch}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit' : 'New'} Quick Reply</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g., Greeting, Billing"
                />
              </div>
              <div className="space-y-2">
                <Label>Shortcut</Label>
                <Input
                  value={form.shortcut}
                  onChange={(e) => setForm({ ...form, shortcut: e.target.value })}
                  placeholder="e.g., hello"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={form.channel || 'all'} onValueChange={(v) => setForm({ ...form, channel: v === 'all' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch
                  checked={form.is_global}
                  onCheckedChange={(v) => setForm({ ...form, is_global: v })}
                />
                <Label className="text-sm">{form.is_global ? 'Global' : 'Personal'}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
