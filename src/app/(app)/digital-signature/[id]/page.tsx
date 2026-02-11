'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, ShieldCheck, Pencil, User, Building2, MapPin, Hash, Store, Calendar, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api/fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  revoked: 'bg-gray-100 text-gray-700 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const classColors: Record<string, string> = {
  class_2: 'bg-blue-100 text-blue-700 border-blue-200',
  class_3: 'bg-purple-100 text-purple-700 border-purple-200',
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  )
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <span className="text-sm text-muted-foreground">-</span>
  const days = differenceInDays(new Date(expiryDate), new Date())
  let color = 'bg-green-100 text-green-700'
  let label = `${days} days remaining`
  if (days < 0) {
    color = 'bg-red-100 text-red-700'
    label = `Expired ${Math.abs(days)} days ago`
  } else if (days < 7) {
    color = 'bg-red-100 text-red-700'
    label = `${days} days remaining`
  } else if (days <= 30) {
    color = 'bg-yellow-100 text-yellow-700'
    label = `${days} days remaining`
  }
  return <Badge variant="secondary" className={color}>{label}</Badge>
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DscDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ holder_name: '', class: 'class_2', pan: '', issued_date: '', expiry_date: '', location: 'with_firm', status: 'active', remarks: '', bin_number: '', vendor: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['dscs', id],
    queryFn: () => apiFetch(`/api/v1/dscs/${id}`),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/dscs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dscs', id] })
      queryClient.invalidateQueries({ queryKey: ['dscs'] })
      toast.success('DSC updated')
      setEditOpen(false)
    },
    onError: () => toast.error('Failed to update DSC'),
  })

  function openEditDialog() {
    const d = data?.data as Record<string, unknown>
    if (!d) return
    setEditForm({
      holder_name: (d.holder_name as string) || '',
      class: (d.class as string) || 'class_2',
      pan: (d.pan as string) || '',
      issued_date: (d.issued_date as string)?.split('T')[0] || '',
      expiry_date: (d.expiry_date as string)?.split('T')[0] || '',
      location: (d.location as string) || 'with_firm',
      status: (d.status as string) || 'active',
      remarks: (d.remarks as string) || '',
      bin_number: (d.bin_number as string) || '',
      vendor: (d.vendor as string) || '',
    })
    setEditOpen(true)
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate({
      holder_name: editForm.holder_name,
      class: editForm.class,
      pan: editForm.pan || undefined,
      issued_date: editForm.issued_date || undefined,
      expiry_date: editForm.expiry_date || undefined,
      location: editForm.location,
      status: editForm.status,
      remarks: editForm.remarks || undefined,
      bin_number: editForm.bin_number || undefined,
      vendor: editForm.vendor || undefined,
    })
  }

  if (isLoading) return <DetailSkeleton />

  const dsc = data?.data as Record<string, unknown> | undefined
  if (!dsc) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">DSC not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/digital-signature')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Digital Signatures
        </Button>
      </div>
    )
  }

  const holderName = dsc.holder_name as string
  const status = dsc.status as string
  const dscClass = dsc.class as string
  const client = dsc.clients as Record<string, string> | null
  const expiryDate = dsc.expiry_date as string | null
  const classLabel = (dscClass || '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/digital-signature')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{holderName}</h1>
            <p className="text-sm text-muted-foreground">{client?.business_name || 'Digital Signature Certificate'}</p>
          </div>
          <Badge variant="secondary" className={classColors[dscClass] || 'bg-gray-100 text-gray-700'}>
            {classLabel}
          </Badge>
          <Badge variant="secondary" className={statusColors[status] || ''}>
            {status}
          </Badge>
        </div>
        <Button onClick={openEditDialog}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Certificate Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0">
              <div className="space-y-0 divide-y">
                <InfoRow icon={Building2} label="Client" value={client?.business_name} />
                <InfoRow icon={User} label="Holder Name" value={holderName} />
                <InfoRow
                  icon={ShieldCheck}
                  label="Class"
                  value={<Badge variant="secondary" className={classColors[dscClass] || ''}>{classLabel}</Badge>}
                />
                <InfoRow
                  icon={Calendar}
                  label="Issued Date"
                  value={dsc.issued_date ? format(new Date(dsc.issued_date as string), 'dd MMM yyyy') : '-'}
                />
                <InfoRow
                  icon={Calendar}
                  label="Expiry Date"
                  value={expiryDate ? format(new Date(expiryDate), 'dd MMM yyyy') : '-'}
                />
              </div>
              <div className="space-y-0 divide-y sm:pl-6">
                <InfoRow icon={MapPin} label="Location" value={(dsc.location as string || '').replace(/_/g, ' ')} />
                <InfoRow icon={Hash} label="BIN Number" value={dsc.bin_number as string} />
                <InfoRow icon={Store} label="Vendor" value={dsc.vendor as string} />
                <InfoRow
                  icon={ShieldCheck}
                  label="Status"
                  value={<Badge variant="secondary" className={statusColors[status] || ''}>{status}</Badge>}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiry Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Expiry Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
            <ExpiryBadge expiryDate={expiryDate} />
            {expiryDate && (
              <p className="text-sm text-muted-foreground text-center">
                Expires on {format(new Date(expiryDate), 'dd MMM yyyy')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit DSC</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Holder Name *</Label>
                <Input value={editForm.holder_name} onChange={(e) => setEditForm({ ...editForm, holder_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={editForm.class} onValueChange={(v) => setEditForm({ ...editForm, class: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class_2">Class 2</SelectItem>
                    <SelectItem value="class_3">Class 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PAN</Label>
                <Input value={editForm.pan} onChange={(e) => setEditForm({ ...editForm, pan: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={editForm.location} onValueChange={(v) => setEditForm({ ...editForm, location: v })}>
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
                <Input type="date" value={editForm.issued_date} onChange={(e) => setEditForm({ ...editForm, issued_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={editForm.expiry_date} onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>BIN Number</Label>
                <Input value={editForm.bin_number} onChange={(e) => setEditForm({ ...editForm, bin_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input value={editForm.vendor} onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
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
                <Textarea value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} rows={2} />
              </div>
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
