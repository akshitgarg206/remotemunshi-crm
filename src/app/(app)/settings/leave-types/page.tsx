'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface LeaveType {
  id: string
  name: string
  paid: boolean
  max_days_per_year: number
  carry_forward: boolean
  is_active: boolean
  created_at: string
}

const emptyForm = {
  name: '',
  paid: true,
  max_days_per_year: 12,
  carry_forward: false,
  is_active: true,
}

export default function LeaveTypesPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'leave-types'],
    queryFn: () => apiFetch('/api/v1/settings/leave-types'),
  })
  const leaveTypes = (data?.data as LeaveType[] | undefined) || []

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) =>
      apiFetch('/api/v1/settings/leave-types', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'leave-types'] })
      toast.success('Leave type created')
      closeDialog()
    },
    onError: () => toast.error('Failed to create leave type'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof emptyForm & { id: string }) =>
      apiFetch(`/api/v1/settings/leave-types/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'leave-types'] })
      toast.success('Leave type updated')
      closeDialog()
    },
    onError: () => toast.error('Failed to update leave type'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/settings/leave-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'leave-types'] })
      toast.success('Leave type deleted')
    },
    onError: () => toast.error('Failed to delete leave type'),
  })

  function closeDialog() {
    setOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function openEdit(item: LeaveType) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      paid: item.paid,
      max_days_per_year: item.max_days_per_year,
      carry_forward: item.carry_forward,
      is_active: item.is_active,
    })
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ ...form, id: editingId })
    } else {
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Leave Types</h1>
          <p className="text-muted-foreground text-sm">Configure leave policies and entitlements</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Leave Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Casual Leave"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_days">Max Days Per Year</Label>
                <Input
                  id="max_days"
                  type="number"
                  min={0}
                  value={form.max_days_per_year}
                  onChange={(e) =>
                    setForm({ ...form, max_days_per_year: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    id="paid"
                    checked={form.paid}
                    onCheckedChange={(checked) => setForm({ ...form, paid: checked })}
                  />
                  <Label htmlFor="paid">Paid Leave</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="carry_forward"
                    checked={form.carry_forward}
                    onCheckedChange={(checked) => setForm({ ...form, carry_forward: checked })}
                  />
                  <Label htmlFor="carry_forward">Carry Forward</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leave Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !leaveTypes?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No leave types found.</p>
              <p className="text-sm mt-1">Click &ldquo;Add Leave Type&rdquo; to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Max Days</TableHead>
                  <TableHead>Carry Forward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={item.paid ? 'default' : 'secondary'}>
                        {item.paid ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.max_days_per_year}</TableCell>
                    <TableCell>
                      <Badge variant={item.carry_forward ? 'default' : 'secondary'}>
                        {item.carry_forward ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this leave type?')) deleteMutation.mutate(item.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  )
}
