'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { FileKey, ShieldCheck, ShieldAlert, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api/fetch'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  revoked: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'holder_name', header: 'Holder Name', cell: ({ row }) => <span className="font-medium">{row.getValue('holder_name') as string}</span> },
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => (row.getValue('clients') as Record<string, string>)?.business_name || '-' },
  { accessorKey: 'class', header: 'Class', cell: ({ row }) => <Badge variant="secondary">{(row.getValue('class') as string || '').replace('_', ' ').toUpperCase()}</Badge> },
  { accessorKey: 'expiry_date', header: 'Expiry', cell: ({ row }) => { const d = row.getValue('expiry_date') as string; return d ? new Date(d).toLocaleDateString('en-IN') : '-' } },
  { accessorKey: 'location', header: 'Location', cell: ({ row }) => <span className="capitalize">{(row.getValue('location') as string || '').replace(/_/g, ' ')}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s = row.getValue('status') as string; return <Badge variant="secondary" className={statusColors[s]}>{s}</Badge> } },
]

const emptyDscForm = {
  client_id: '', holder_name: '', class: 'class_2', pan: '',
  issued_date: '', expiry_date: '', location: 'with_firm', status: 'active', remarks: '',
}

export default function DscPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyDscForm)

  const { data: clientsData } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => apiFetch('/api/v1/clients?pageSize=500&fields=id,business_name'),
  })
  const clients = (clientsData?.data ?? []) as { id: string; business_name: string }[]

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/dscs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dscs'] })
      toast.success('DSC created')
      setAddOpen(false)
      setForm(emptyDscForm)
    },
    onError: () => toast.error('Failed to create DSC'),
  })

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      client_id: form.client_id || undefined,
      holder_name: form.holder_name,
      class: form.class,
      pan: form.pan || undefined,
      issued_date: form.issued_date || undefined,
      expiry_date: form.expiry_date || undefined,
      location: form.location,
      status: form.status,
      remarks: form.remarks || undefined,
    })
  }

  const { data, isLoading } = useQuery({
    queryKey: ['dscs', { page, search }],
    queryFn: () => apiFetch(`/api/v1/dscs?page=${page}&pageSize=20&search=${search}`),
  })
  const { data: kpiData } = useQuery({
    queryKey: ['dscs', 'kpi'],
    queryFn: () => apiFetch('/api/v1/dscs/kpi'),
  })
  const kpis = kpiData?.data as Record<string, number> | undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Digital Signatures</h1>
        <p className="text-muted-foreground">Manage DSC tokens and certificates</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total DSCs" value={kpis?.total_dscs ?? 0} icon={FileKey} color="bg-primary" />
        <KpiCard title="Active" value={kpis?.active_dscs ?? 0} icon={ShieldCheck} color="bg-green-500" />
        <KpiCard title="Expired" value={kpis?.expired_dscs ?? 0} icon={ShieldAlert} color="bg-red-500" />
        <KpiCard title="Expiring Soon" value={kpis?.expiring_soon ?? 0} icon={Clock} color="bg-yellow-500" />
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search DSCs..."
        onSearch={setSearch}
        onAdd={() => setAddOpen(true)}
        addLabel="Add DSC"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/digital-signature/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="dscs" open={importOpen} onOpenChange={setImportOpen} />

      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) { setAddOpen(false); setForm(emptyDscForm) } else setAddOpen(true) }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add DSC</DialogTitle>
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
                <Label>Holder Name *</Label>
                <Input value={form.holder_name} onChange={(e) => setForm({ ...form, holder_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class_2">Class 2</SelectItem>
                    <SelectItem value="class_3">Class 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PAN</Label>
                <Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} placeholder="ABCDE1234F" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="with_firm">With Firm</SelectItem>
                    <SelectItem value="with_client">With Client</SelectItem>
                    <SelectItem value="with_vendor">With Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Issued Date</Label>
                <Input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Remarks</Label>
                <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setForm(emptyDscForm) }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create DSC'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
