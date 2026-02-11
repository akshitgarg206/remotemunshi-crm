'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Package,
  Users,
  Briefcase,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return '-'
  }
}

function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || '-'}</dd>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">{message}</div>
  )
}

export default function BundleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', bundle_price: '', is_active: true })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/bundles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles', id] })
      queryClient.invalidateQueries({ queryKey: ['bundles'] })
      toast.success('Bundle updated')
      setEditOpen(false)
    },
    onError: () => toast.error('Failed to update bundle'),
  })

  function openEditDialog() {
    if (!bundle) return
    setEditForm({
      name: bundle.name || '',
      description: bundle.description || '',
      bundle_price: bundle.bundle_price != null ? String(bundle.bundle_price) : '',
      is_active: bundle.is_active !== false,
    })
    setEditOpen(true)
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate({
      name: editForm.name,
      description: editForm.description || undefined,
      bundle_price: editForm.bundle_price ? Number(editForm.bundle_price) : undefined,
      is_active: editForm.is_active,
    })
  }

  const { data: bundleRes, isLoading: bundleLoading } = useQuery({
    queryKey: ['bundles', id],
    queryFn: () => apiFetch(`/api/v1/bundles/${id}`),
    enabled: !!id,
  })
  const bundle = (bundleRes as any)?.data as Record<string, any> | undefined

  // Fetch clients using this bundle
  // We query all client_bundles that reference this bundle_id, joined with clients
  const { data: clientBundlesRes, isLoading: clientsLoading } = useQuery({
    queryKey: ['bundles', id, 'clients'],
    queryFn: () => apiFetch(`/api/v1/bundles/${id}/clients`).catch(() => ({ data: [] })),
    enabled: !!id,
  })
  const clientBundles = ((clientBundlesRes as any)?.data ?? []) as any[]

  // Loading state
  if (bundleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  if (!bundle) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/bundles')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bundles
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Bundle not found
        </div>
      </div>
    )
  }

  const isActive = bundle.is_active !== false
  const items = (bundle.service_bundle_items ?? []) as any[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/bundles')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {bundle.name}
              </h1>
              <Badge
                variant="secondary"
                className={
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }
              >
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {formatINR(bundle.bundle_price)}
            </p>
          </div>
        </div>
        <Button onClick={openEditDialog}>
          <Pencil className="mr-2 h-4 w-4" /> Edit Bundle
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundle Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <DetailField label="Name" value={bundle.name} />
            <DetailField label="Price" value={formatINR(bundle.bundle_price)} />
            <DetailField label="Description" value={bundle.description} />
            <DetailField label="Created" value={formatDate(bundle.created_at)} />
          </dl>
        </CardContent>
      </Card>

      {/* Services Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Services in Bundle ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>SAC Code</TableHead>
                  <TableHead className="text-right">Default Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => {
                  const svc = item.services || {}
                  const cat = svc.service_categories
                  return (
                    <TableRow key={item.service_id}>
                      <TableCell className="font-medium">
                        {svc.name || '-'}
                      </TableCell>
                      <TableCell>
                        {cat?.name ? (
                          <Badge variant="secondary">{cat.name}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{svc.sac_code || '-'}</TableCell>
                      <TableCell className="text-right">
                        {formatINR(svc.default_rate)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No services in this bundle" />
          )}
        </CardContent>
      </Card>

      {/* Clients Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clients Using This Bundle
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clientsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : clientBundles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Agreed Price</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientBundles.map((cb: any) => {
                  const client = cb.clients || {}
                  return (
                    <TableRow key={cb.id || cb.client_id}>
                      <TableCell className="font-medium">
                        {client.business_name || client.contact_name || cb.client_id || '-'}
                      </TableCell>
                      <TableCell>
                        {cb.agreed_price != null
                          ? formatINR(cb.agreed_price)
                          : formatINR(bundle.bundle_price)}
                      </TableCell>
                      <TableCell>{formatDate(cb.start_date)}</TableCell>
                      <TableCell>{formatDate(cb.end_date)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No clients are using this bundle yet" />
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input type="number" value={editForm.bundle_price} onChange={(e) => setEditForm({ ...editForm, bundle_price: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editForm.is_active} onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
