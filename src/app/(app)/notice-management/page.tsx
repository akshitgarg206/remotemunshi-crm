'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api/fetch'

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => <span className="font-medium">{(row.getValue('clients') as Record<string, string>)?.business_name || '-'}</span> },
  { accessorKey: 'notice_types', header: 'Type', cell: ({ row }) => (row.getValue('notice_types') as Record<string, string>)?.name || '-' },
  { accessorKey: 'section', header: 'Section' },
  { accessorKey: 'assessment_year', header: 'AY' },
  { accessorKey: 'due_date', header: 'Due Date', cell: ({ row }) => { const d = row.getValue('due_date') as string; return d ? new Date(d).toLocaleDateString('en-IN') : '-' } },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s = row.getValue('status') as string; return <Badge variant="secondary" className={statusColors[s]}>{s.replace(/_/g, ' ')}</Badge> } },
]

const emptyNoticeForm = {
  client_id: '', notice_type: '', section: '', assessment_year: '',
  received_date: '', due_date: '', hearing_date: '', status: 'open', remarks: '',
}

export default function NoticeManagementPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyNoticeForm)

  const { data: clientsData } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => apiFetch('/api/v1/clients?pageSize=500&fields=id,business_name'),
  })
  const clients = (clientsData?.data ?? []) as { id: string; business_name: string }[]

  const { data: noticeTypesData } = useQuery({
    queryKey: ['settings', 'notice-types'],
    queryFn: () => apiFetch('/api/v1/settings/notice-types'),
  })
  const noticeTypes = (noticeTypesData?.data ?? []) as { id: string; name: string }[]

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/notices', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      toast.success('Notice created')
      setAddOpen(false)
      setForm(emptyNoticeForm)
    },
    onError: () => toast.error('Failed to create notice'),
  })

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      client_id: form.client_id || undefined,
      notice_type: form.notice_type || undefined,
      section: form.section || undefined,
      assessment_year: form.assessment_year || undefined,
      received_date: form.received_date || undefined,
      due_date: form.due_date || undefined,
      hearing_date: form.hearing_date || undefined,
      status: form.status,
      remarks: form.remarks || undefined,
    })
  }

  const { data, isLoading } = useQuery({
    queryKey: ['notices', { page, search }],
    queryFn: () => apiFetch(`/api/v1/notices?page=${page}&pageSize=20&search=${search}`),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notice Management</h1>
        <p className="text-muted-foreground">Track and manage client notices</p>
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search notices..."
        onSearch={setSearch}
        onAdd={() => setAddOpen(true)}
        addLabel="Add Notice"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/notice-management/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="notices" open={importOpen} onOpenChange={setImportOpen} />

      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) { setAddOpen(false); setForm(emptyNoticeForm) } else setAddOpen(true) }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Client</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notice Type</Label>
                {noticeTypes.length > 0 ? (
                  <Select value={form.notice_type} onValueChange={(v) => setForm({ ...form, notice_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {noticeTypes.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.notice_type} onChange={(e) => setForm({ ...form, notice_type: e.target.value })} placeholder="e.g. Income Tax" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="e.g. 143(1)" />
              </div>
              <div className="space-y-2">
                <Label>Assessment Year</Label>
                <Input value={form.assessment_year} onChange={(e) => setForm({ ...form, assessment_year: e.target.value })} placeholder="e.g. 2025-26" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Received Date</Label>
                <Input type="date" value={form.received_date} onChange={(e) => setForm({ ...form, received_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hearing Date</Label>
                <Input type="date" value={form.hearing_date} onChange={(e) => setForm({ ...form, hearing_date: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Remarks</Label>
                <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setForm(emptyNoticeForm) }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Notice'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
