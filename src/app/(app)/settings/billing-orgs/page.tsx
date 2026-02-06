'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

interface BillingOrg {
  id: string
  name: string
  legal_name: string
  gstin: string
  pan: string
  address: string
  city: string
  state: string
  pincode: string
  bank_name: string
  bank_account: string
  bank_ifsc: string
  is_default: boolean
}

const emptyForm: Omit<BillingOrg, 'id'> = {
  name: '',
  legal_name: '',
  gstin: '',
  pan: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  bank_name: '',
  bank_account: '',
  bank_ifsc: '',
  is_default: false,
}

export default function BillingOrgsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['billing-orgs'],
    queryFn: () => apiFetch<BillingOrg[]>('/api/v1/settings/billing-orgs'),
  })

  const createMutation = useMutation({
    mutationFn: (d: typeof emptyForm) =>
      apiFetch('/api/v1/settings/billing-orgs', { method: 'POST', body: JSON.stringify(d) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-orgs'] })
      setDialogOpen(false)
      resetForm()
      toast.success('Billing organization created')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (d: typeof emptyForm & { id: string }) =>
      apiFetch(`/api/v1/settings/billing-orgs/${d.id}`, { method: 'PUT', body: JSON.stringify(d) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-orgs'] })
      setDialogOpen(false)
      resetForm()
      toast.success('Billing organization updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/settings/billing-orgs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-orgs'] })
      toast.success('Billing organization deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const orgs = (data?.data as BillingOrg[] | undefined) || []
  const isPending = createMutation.isPending || updateMutation.isPending

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function openAdd() {
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(org: BillingOrg) {
    setEditingId(org.id)
    setForm({
      name: org.name,
      legal_name: org.legal_name,
      gstin: org.gstin,
      pan: org.pan,
      address: org.address,
      city: org.city,
      state: org.state,
      pincode: org.pincode,
      bank_name: org.bank_name,
      bank_account: org.bank_account,
      bank_ifsc: org.bank_ifsc,
      is_default: org.is_default,
    })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ ...form, id: editingId })
    } else {
      createMutation.mutate(form)
    }
  }

  function setField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Billing Organizations</h1>
          <p className="text-muted-foreground">Manage billing entities and bank details</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Organization</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orgs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p>No billing organizations yet</p>
              <Button variant="outline" className="mt-4" onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" />Add your first organization
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="font-mono text-sm">{org.gstin || '-'}</TableCell>
                    <TableCell>{org.city || '-'}</TableCell>
                    <TableCell>
                      {org.is_default ? (
                        <Badge variant="default">Default</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(org)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this billing organization?')) {
                              deleteMutation.mutate(org.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Billing Organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name *</Label>
                  <Input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Legal Name</Label>
                  <Input value={form.legal_name} onChange={(e) => setField('legal_name', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input value={form.gstin} onChange={(e) => setField('gstin', e.target.value)} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="space-y-2">
                  <Label>PAN</Label>
                  <Input value={form.pan} onChange={(e) => setField('pan', e.target.value)} placeholder="AAAAA0000A" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Address</h3>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={form.address} onChange={(e) => setField('address', e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => setField('city', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={form.state} onChange={(e) => setField('state', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} maxLength={6} />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bank Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input value={form.bank_name} onChange={(e) => setField('bank_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={form.bank_account} onChange={(e) => setField('bank_account', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input value={form.bank_ifsc} onChange={(e) => setField('bank_ifsc', e.target.value)} placeholder="SBIN0000001" />
                </div>
              </div>
            </div>

            {/* Default toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_default"
                checked={form.is_default}
                onCheckedChange={(checked) => setField('is_default', checked === true)}
              />
              <Label htmlFor="is_default">Set as default billing organization</Label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
