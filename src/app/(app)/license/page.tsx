'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Award, ShieldCheck, ShieldAlert, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api/fetch'

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'license_name', header: 'License Name', cell: ({ row }) => <span className="font-medium">{row.getValue('license_name') as string}</span> },
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => (row.getValue('clients') as Record<string, string>)?.business_name || '-' },
  { accessorKey: 'registration_no', header: 'Reg. No.' },
  { accessorKey: 'issuing_authority', header: 'Authority' },
  { accessorKey: 'expiry_date', header: 'Expiry', cell: ({ row }) => { const d = row.getValue('expiry_date') as string; return d ? new Date(d).toLocaleDateString('en-IN') : '-' } },
]

const emptyLicenseForm = {
  client_id: '', license_name: '', license_type: '', registration_no: '',
  issued_date: '', expiry_date: '', issuing_authority: '', url: '', remarks: '',
}

export default function LicensePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyLicenseForm)

  const { data: clientsData } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => apiFetch('/api/v1/clients?pageSize=500&fields=id,business_name'),
  })
  const clients = (clientsData?.data ?? []) as { id: string; business_name: string }[]

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/licenses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      toast.success('License created')
      setAddOpen(false)
      setForm(emptyLicenseForm)
    },
    onError: () => toast.error('Failed to create license'),
  })

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      client_id: form.client_id || undefined,
      license_name: form.license_name,
      license_type: form.license_type || undefined,
      registration_no: form.registration_no || undefined,
      issued_date: form.issued_date || undefined,
      expiry_date: form.expiry_date || undefined,
      issuing_authority: form.issuing_authority || undefined,
      url: form.url || undefined,
      remarks: form.remarks || undefined,
    })
  }

  const { data, isLoading } = useQuery({
    queryKey: ['licenses', { page, search }],
    queryFn: () => apiFetch(`/api/v1/licenses?page=${page}&pageSize=20&search=${search}`),
  })
  const { data: kpiData } = useQuery({
    queryKey: ['licenses', 'kpi'],
    queryFn: () => apiFetch('/api/v1/licenses/kpi'),
  })
  const kpis = kpiData?.data as Record<string, number> | undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Licenses</h1>
        <p className="text-muted-foreground">Track client licenses and registrations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total" value={kpis?.total_licenses ?? 0} icon={Award} color="bg-primary" />
        <KpiCard title="Active" value={kpis?.active_licenses ?? 0} icon={ShieldCheck} color="bg-green-500" />
        <KpiCard title="Expired" value={kpis?.expired_licenses ?? 0} icon={ShieldAlert} color="bg-red-500" />
        <KpiCard title="Expiring Soon" value={kpis?.expiring_soon ?? 0} icon={Clock} color="bg-yellow-500" />
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search licenses..."
        onSearch={setSearch}
        onAdd={() => setAddOpen(true)}
        addLabel="Add License"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/license/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="licenses" open={importOpen} onOpenChange={setImportOpen} />

      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) { setAddOpen(false); setForm(emptyLicenseForm) } else setAddOpen(true) }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add License</DialogTitle>
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
                <Label>License Name *</Label>
                <Input value={form.license_name} onChange={(e) => setForm({ ...form, license_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })} placeholder="e.g. GST, MSME" />
              </div>
              <div className="space-y-2">
                <Label>Registration No.</Label>
                <Input value={form.registration_no} onChange={(e) => setForm({ ...form, registration_no: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Issuing Authority</Label>
                <Input value={form.issuing_authority} onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Issued Date</Label>
                <Input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>URL</Label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Remarks</Label>
                <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setForm(emptyLicenseForm) }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create License'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
