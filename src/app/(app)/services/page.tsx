'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Briefcase } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'

function useServices(params?: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) sp.set(k, String(v)) })
  return useQuery({ queryKey: ['services', params], queryFn: () => apiFetch(`/api/v1/services?${sp.toString()}`) })
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'name', header: 'Service Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name') as string}</span> },
  { accessorKey: 'service_categories', header: 'Category', cell: ({ row }) => {
    const cat = row.getValue('service_categories') as Record<string, string> | null
    return cat ? <Badge variant="secondary">{cat.name}</Badge> : '-'
  }},
  { accessorKey: 'sac_code', header: 'SAC Code' },
  { accessorKey: 'default_rate', header: 'Default Rate', cell: ({ row }) => `₹${(row.getValue('default_rate') as number || 0).toLocaleString()}` },
  { accessorKey: 'frequency', header: 'Frequency', cell: ({ row }) => {
    const freq = row.getValue('frequency') as string | null
    return freq ? <span className="capitalize">{freq.replace(/_/g, ' ')}</span> : '-'
  }},
  { accessorKey: 'due_day_of_month', header: 'Due Day', cell: ({ row }) => {
    const day = row.getValue('due_day_of_month') as number | null
    return day ? `${day}${getOrdinalSuffix(day)}` : '-'
  }},
]

interface NewService {
  name: string
  sac_code: string
  default_rate: number
  frequency: string
  due_day_of_month: number | null
  requires_data_collection: boolean
  data_description: string
}

const initialNewService: NewService = {
  name: '',
  sac_code: '',
  default_rate: 0,
  frequency: '',
  due_day_of_month: null,
  requires_data_collection: false,
  data_description: '',
}

export default function ServicesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [newService, setNewService] = useState<NewService>(initialNewService)
  const { data, isLoading } = useServices({ page, pageSize: 50, search })
  const qc = useQueryClient()
  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiFetch('/api/v1/services', { method: 'POST', body: JSON.stringify(d) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      setDialogOpen(false)
      setNewService(initialNewService)
      toast.success('Service created')
    },
  })

  const handleCreate = () => {
    const payload: Record<string, unknown> = {
      name: newService.name,
      sac_code: newService.sac_code || undefined,
      default_rate: newService.default_rate || undefined,
    }
    if (newService.frequency) {
      payload.frequency = newService.frequency
      if (newService.due_day_of_month) payload.due_day_of_month = newService.due_day_of_month
      payload.requires_data_collection = newService.requires_data_collection
      if (newService.requires_data_collection && newService.data_description) {
        payload.data_description = newService.data_description
      }
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your service offerings</p>
        </div>
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search services..."
        onSearch={setSearch}
        onAdd={() => setDialogOpen(true)}
        addLabel="Add Service"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/services/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreate() }} className="space-y-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>SAC Code</Label>
              <Input value={newService.sac_code} onChange={(e) => setNewService({ ...newService, sac_code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Default Rate (₹)</Label>
              <Input type="number" value={newService.default_rate} onChange={(e) => setNewService({ ...newService, default_rate: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={newService.frequency}
                onValueChange={(v) => setNewService({ ...newService, frequency: v, due_day_of_month: v ? newService.due_day_of_month : null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (no recurring deadlines)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="half_yearly">Half Yearly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newService.frequency && (
              <div className="space-y-2">
                <Label>Due Day of Month (1-31)</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={newService.due_day_of_month ?? ''}
                  onChange={(e) => setNewService({ ...newService, due_day_of_month: e.target.value ? Number(e.target.value) : null })}
                  placeholder="e.g. 15"
                />
              </div>
            )}
            {newService.frequency && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_data"
                  checked={newService.requires_data_collection}
                  onCheckedChange={(checked) => setNewService({ ...newService, requires_data_collection: !!checked })}
                />
                <Label htmlFor="requires_data" className="cursor-pointer">Requires Data Collection</Label>
              </div>
            )}
            {newService.frequency && newService.requires_data_collection && (
              <div className="space-y-2">
                <Label>Data Description</Label>
                <Input
                  value={newService.data_description}
                  onChange={(e) => setNewService({ ...newService, data_description: e.target.value })}
                  placeholder="e.g. Monthly sales & purchase data"
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CsvImporter module="services" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
