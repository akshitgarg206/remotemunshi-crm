'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, FileText, Pencil, Building2, Hash, Landmark, Calendar, Clock, ExternalLink, StickyNote, Paperclip } from 'lucide-react'
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

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ license_name: '', license_type: '', registration_no: '', issuing_authority: '', issued_date: '', expiry_date: '', url: '', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['licenses', id],
    queryFn: () => apiFetch(`/api/v1/licenses/${id}`),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/licenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses', id] })
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      toast.success('License updated')
      setEditOpen(false)
    },
    onError: () => toast.error('Failed to update license'),
  })

  function openEditDialog() {
    const l = data?.data as Record<string, unknown>
    if (!l) return
    setEditForm({
      license_name: (l.license_name as string) || '',
      license_type: (l.license_type as string) || '',
      registration_no: (l.registration_no as string) || '',
      issuing_authority: (l.issuing_authority as string) || '',
      issued_date: (l.issued_date as string)?.split('T')[0] || '',
      expiry_date: (l.expiry_date as string)?.split('T')[0] || '',
      url: (l.url as string) || '',
      notes: (l.notes as string) || '',
    })
    setEditOpen(true)
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate({
      license_name: editForm.license_name,
      license_type: editForm.license_type || undefined,
      registration_no: editForm.registration_no || undefined,
      issuing_authority: editForm.issuing_authority || undefined,
      issued_date: editForm.issued_date || undefined,
      expiry_date: editForm.expiry_date || undefined,
      url: editForm.url || undefined,
      notes: editForm.notes || undefined,
    })
  }

  if (isLoading) return <DetailSkeleton />

  const license = data?.data as Record<string, unknown> | undefined
  if (!license) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">License not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/license')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Licenses
        </Button>
      </div>
    )
  }

  const licenseName = license.license_name as string
  const client = license.clients as Record<string, string> | null
  const expiryDate = license.expiry_date as string | null
  const url = license.url as string | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/license')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{licenseName}</h1>
            <p className="text-sm text-muted-foreground">{client?.business_name || 'License'}</p>
          </div>
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
              <FileText className="h-5 w-5" /> License Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0">
              <div className="space-y-0 divide-y">
                <InfoRow icon={Building2} label="Client" value={client?.business_name} />
                <InfoRow icon={FileText} label="License Name" value={licenseName} />
                <InfoRow icon={Hash} label="Registration No." value={license.registration_no as string} />
                <InfoRow icon={Landmark} label="Issuing Authority" value={license.issuing_authority as string} />
              </div>
              <div className="space-y-0 divide-y sm:pl-6">
                <InfoRow
                  icon={Calendar}
                  label="Issued Date"
                  value={license.issued_date ? format(new Date(license.issued_date as string), 'dd MMM yyyy') : '-'}
                />
                <InfoRow
                  icon={Calendar}
                  label="Expiry Date"
                  value={expiryDate ? format(new Date(expiryDate), 'dd MMM yyyy') : '-'}
                />
                <InfoRow
                  icon={ExternalLink}
                  label="URL"
                  value={
                    url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        {url} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : '-'
                  }
                />
                <InfoRow icon={StickyNote} label="Notes" value={license.notes as string} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiry Card */}
        <div className="space-y-4">
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

          {/* Attachments Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" /> Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Paperclip className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No attachments</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit License</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>License Name *</Label>
                <Input value={editForm.license_name} onChange={(e) => setEditForm({ ...editForm, license_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input value={editForm.license_type} onChange={(e) => setEditForm({ ...editForm, license_type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Registration No.</Label>
                <Input value={editForm.registration_no} onChange={(e) => setEditForm({ ...editForm, registration_no: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Issuing Authority</Label>
                <Input value={editForm.issuing_authority} onChange={(e) => setEditForm({ ...editForm, issuing_authority: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Issued Date</Label>
                <Input type="date" value={editForm.issued_date} onChange={(e) => setEditForm({ ...editForm, issued_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={editForm.expiry_date} onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>URL</Label>
                <Input value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} />
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
