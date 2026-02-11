'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Users, ListTodo, Repeat, Package } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'

/* eslint-disable @typescript-eslint/no-explicit-any */

function useServices(params?: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== '') sp.set(k, String(v)) })
  return useQuery({ queryKey: ['services', params], queryFn: () => apiFetch(`/api/v1/services?${sp.toString()}`) })
}

interface ServiceForm {
  name: string
  description: string
  frequency: string
  due_day_of_month: string
  requires_data_collection: boolean
  data_description: string
}

const initialForm: ServiceForm = {
  name: '', description: '', frequency: '', due_day_of_month: '',
  requires_data_collection: false, data_description: '',
}

export default function ServicesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [association, setAssociation] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [form, setForm] = useState<ServiceForm>(initialForm)
  const { data, isLoading } = useServices({ page, pageSize: 50, search, association })
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

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
    }
    if (form.frequency) {
      payload.frequency = form.frequency
      if (form.due_day_of_month) payload.due_day_of_month = Number(form.due_day_of_month)
      payload.requires_data_collection = form.requires_data_collection
      if (form.requires_data_collection && form.data_description) {
        payload.data_description = form.data_description
      }
    }
    return payload
  }

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'name',
      header: 'Service',
      cell: ({ row }) => {
        const counts = (row.original as any)._counts || { clients: 0, tasks: 0, templates: 0, bundles: 0 }
        const parts: string[] = []
        if (counts.clients > 0) parts.push(`${counts.clients} client${counts.clients !== 1 ? 's' : ''}`)
        if (counts.tasks > 0) parts.push(`${counts.tasks} task${counts.tasks !== 1 ? 's' : ''}`)
        if (counts.templates > 0) parts.push(`${counts.templates} template${counts.templates !== 1 ? 's' : ''}`)
        if (counts.bundles > 0) parts.push(`${counts.bundles} bundle${counts.bundles !== 1 ? 's' : ''}`)
        return (
          <div>
            <span className="font-medium">{row.getValue('name') as string}</span>
            {parts.length > 0 && (
              <div className="text-xs text-muted-foreground mt-0.5">{parts.join(' · ')}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'service_categories',
      header: 'Category',
      cell: ({ row }) => {
        const cat = row.getValue('service_categories') as Record<string, string> | null
        return cat ? <Badge variant="secondary">{cat.name}</Badge> : '-'
      },
    },
    {
      accessorKey: 'frequency',
      header: 'Frequency',
      cell: ({ row }) => {
        const freq = row.getValue('frequency') as string | null
        return freq ? <span className="capitalize">{freq.replace(/_/g, ' ')}</span> : '-'
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const active = row.getValue('is_active') !== false
        return (
          <Badge variant="secondary" className={active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}>
            {active ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your service offerings</p>
        </div>
      </div>

      {/* Association filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <div className="flex gap-1.5">
          {[
            { value: '', label: 'All', icon: null },
            { value: 'clients', label: 'With Clients', icon: Users },
            { value: 'tasks', label: 'With Tasks', icon: ListTodo },
            { value: 'templates', label: 'With Templates', icon: Repeat },
            { value: 'bundles', label: 'With Bundles', icon: Package },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setAssociation(opt.value); setPage(1) }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                association === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.icon && <opt.icon className="h-3 w-3" />}
              {opt.label}
            </button>
          ))}
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(buildPayload()) }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CsvImporter module="services" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
