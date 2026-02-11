'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'

/* eslint-disable @typescript-eslint/no-explicit-any */

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

interface ServiceForm {
  name: string
  sac_code: string
  description: string
  default_rate: string
  frequency: string
  due_day_of_month: string
  requires_data_collection: boolean
  data_description: string
  is_active: boolean
}

const initialForm: ServiceForm = {
  name: '', sac_code: '', description: '', default_rate: '',
  frequency: '', due_day_of_month: '', requires_data_collection: false,
  data_description: '', is_active: true,
}

export default function ServicesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [form, setForm] = useState<ServiceForm>(initialForm)
  const { data, isLoading } = useServices({ page, pageSize: 50, search })
  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiFetch('/api/v1/services', { method: 'POST', body: JSON.stringify(d) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      setAddOpen(false)
      setForm(initialForm)
      toast.success('Service created')
    },
    onError: () => toast.error('Failed to create service'),
  })

  const updateMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiFetch(`/api/v1/services/${editId}`, { method: 'PUT', body: JSON.stringify(d) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      setEditOpen(false)
      setEditId(null)
      setForm(initialForm)
      toast.success('Service updated')
    },
    onError: () => toast.error('Failed to update service'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/services/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service deleted')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete service')
    },
  })

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      name: form.name,
      sac_code: form.sac_code || undefined,
      description: form.description || undefined,
      default_rate: form.default_rate ? Number(form.default_rate) : 0,
      is_active: form.is_active,
    }
    if (form.frequency) {
      payload.frequency = form.frequency
      if (form.due_day_of_month) payload.due_day_of_month = Number(form.due_day_of_month)
      payload.requires_data_collection = form.requires_data_collection
      if (form.requires_data_collection && form.data_description) {
        payload.data_description = form.data_description
      }
    } else {
      payload.frequency = undefined
      payload.due_day_of_month = undefined
      payload.requires_data_collection = false
      payload.data_description = undefined
    }
    return payload
  }

  function openEdit(row: Record<string, any>) {
    setEditId(row.id as string)
    setForm({
      name: row.name || '',
      sac_code: row.sac_code || '',
      description: row.description || '',
      default_rate: row.default_rate != null ? String(row.default_rate) : '',
      frequency: row.frequency || '',
      due_day_of_month: row.due_day_of_month != null ? String(row.due_day_of_month) : '',
      requires_data_collection: row.requires_data_collection === true,
      data_description: row.data_description || '',
      is_active: row.is_active !== false,
    })
    setEditOpen(true)
  }

  function handleDelete(row: Record<string, any>) {
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return
    deleteMutation.mutate(row.id as string)
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
    { id: 'actions', header: '', size: 100, cell: ({ row }) => (
      <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row.original as Record<string, any>)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(row.original as Record<string, any>)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )},
  ]

  const formJSX = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Service Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>SAC Code</Label>
          <Input value={form.sac_code} onChange={(e) => setForm({ ...form, sac_code: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Default Rate (₹)</Label>
          <Input type="number" value={form.default_rate} onChange={(e) => setForm({ ...form, default_rate: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <div className="space-y-2">
        <Label>Frequency</Label>
        <Select
          value={form.frequency || '__none__'}
          onValueChange={(v) => {
            const freq = v === '__none__' ? '' : v
            setForm({ ...form, frequency: freq, due_day_of_month: freq ? form.due_day_of_month : '' })
          }}
        >
          <SelectTrigger><SelectValue placeholder="None (no recurring deadlines)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="half_yearly">Half Yearly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.frequency && (
        <div className="space-y-2">
          <Label>Due Day of Month (1-31)</Label>
          <Input
            type="number" min={1} max={31}
            value={form.due_day_of_month}
            onChange={(e) => setForm({ ...form, due_day_of_month: e.target.value })}
            placeholder="e.g. 15"
          />
        </div>
      )}
      {form.frequency && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="requires_data"
            checked={form.requires_data_collection}
            onCheckedChange={(checked) => setForm({ ...form, requires_data_collection: !!checked })}
          />
          <Label htmlFor="requires_data" className="cursor-pointer">Requires Data Collection</Label>
        </div>
      )}
      {form.frequency && form.requires_data_collection && (
        <div className="space-y-2">
          <Label>Data Description</Label>
          <Input
            value={form.data_description}
            onChange={(e) => setForm({ ...form, data_description: e.target.value })}
            placeholder="e.g. Monthly sales & purchase data"
          />
        </div>
      )}
    </div>
  )

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
        onAdd={() => { setForm(initialForm); setAddOpen(true) }}
        addLabel="Add Service"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/services/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(buildPayload()) }}>
            {formJSX}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditId(null) }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Edit Service</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(buildPayload()) }}>
            {formJSX}
            <div className="flex items-center gap-3 pt-4">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CsvImporter module="services" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
