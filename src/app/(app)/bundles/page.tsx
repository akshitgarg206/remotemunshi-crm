'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'

/* eslint-disable @typescript-eslint/no-explicit-any */

function useBundles(params?: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined) sp.set(k, String(v))
  })
  return useQuery({
    queryKey: ['bundles', params],
    queryFn: () => apiFetch(`/api/v1/bundles?${sp.toString()}`),
  })
}

function useServicesList() {
  return useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => apiFetch('/api/v1/services?pageSize=100'),
  })
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name') as string}</span>
    ),
  },
  {
    accessorKey: 'bundle_price',
    header: 'Price',
    cell: ({ row }) =>
      `₹${((row.getValue('bundle_price') as number) || 0).toLocaleString('en-IN')}`,
  },
  {
    accessorKey: 'service_bundle_items',
    header: 'Services',
    cell: ({ row }) => {
      const items = row.getValue('service_bundle_items') as any[] | null
      return items?.length ?? 0
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const active = row.original.is_active !== false
      return (
        <Badge
          variant="secondary"
          className={
            active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }
        >
          {active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
]

export default function BundlesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newBundle, setNewBundle] = useState({
    name: '',
    description: '',
    bundle_price: 0,
    service_ids: [] as string[],
  })

  const { data, isLoading } = useBundles({ page, pageSize: 50, search })
  const { data: servicesData, isLoading: servicesLoading } = useServicesList()
  const services = ((servicesData as any)?.data ?? []) as any[]

  const qc = useQueryClient()
  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      apiFetch('/api/v1/bundles', {
        method: 'POST',
        body: JSON.stringify(d),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bundles'] })
      setDialogOpen(false)
      setNewBundle({ name: '', description: '', bundle_price: 0, service_ids: [] })
      toast.success('Bundle created')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create bundle')
    },
  })

  function toggleService(serviceId: string) {
    setNewBundle((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Bundles</h1>
          <p className="text-muted-foreground">
            Group services into bundles and assign them to clients
          </p>
        </div>
      </div>

      <DataGrid
        columns={columns}
        data={((data as any)?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search bundles..."
        onSearch={setSearch}
        onAdd={() => setDialogOpen(true)}
        addLabel="Add Bundle"
        onRowClick={(row) => router.push('/bundles/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={(data as any)?.meta?.totalPages || 1}
        totalItems={(data as any)?.meta?.total}
        onPageChange={setPage}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add Bundle
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (newBundle.service_ids.length === 0) {
                toast.error('Select at least one service')
                return
              }
              createMutation.mutate(newBundle)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Bundle Name *</Label>
              <Input
                value={newBundle.name}
                onChange={(e) =>
                  setNewBundle({ ...newBundle, name: e.target.value })
                }
                placeholder="e.g. GST Compliance Pack"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newBundle.description}
                onChange={(e) =>
                  setNewBundle({ ...newBundle, description: e.target.value })
                }
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Bundle Price (INR)</Label>
              <Input
                type="number"
                value={newBundle.bundle_price}
                onChange={(e) =>
                  setNewBundle({
                    ...newBundle,
                    bundle_price: Number(e.target.value),
                  })
                }
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Services * ({newBundle.service_ids.length} selected)
              </Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {servicesLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading services...
                  </p>
                ) : services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No services found. Create services first.
                  </p>
                ) : (
                  services.map((s: any) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
                    >
                      <Checkbox
                        checked={newBundle.service_ids.includes(s.id)}
                        onCheckedChange={() => toggleService(s.id)}
                      />
                      <span className="text-sm flex-1">{s.name}</span>
                      {s.default_rate != null && (
                        <span className="text-xs text-muted-foreground">
                          ₹{Number(s.default_rate).toLocaleString('en-IN')}
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Bundle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
