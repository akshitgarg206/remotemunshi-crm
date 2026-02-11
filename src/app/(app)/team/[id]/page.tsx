'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowLeft, Pencil, User, Mail, Phone, Briefcase, Building2, Calendar, IndianRupee, ClipboardList, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api/fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  on_leave: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  terminated: 'bg-red-100 text-red-700 border-red-200',
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

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '', role_id: '', designation_id: '', department_id: '', status: '', join_date: '', salary: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => apiFetch(`/api/v1/team/${id}`),
    enabled: !!id,
  })

  const { data: rolesData } = useQuery({ queryKey: ['settings', 'roles'], queryFn: () => apiFetch('/api/v1/settings/roles') })
  const { data: deptsData } = useQuery({ queryKey: ['settings', 'departments'], queryFn: () => apiFetch('/api/v1/settings/departments') })
  const { data: desigsData } = useQuery({ queryKey: ['settings', 'designations'], queryFn: () => apiFetch('/api/v1/settings/designations') })
  const roles = (rolesData?.data ?? []) as { id: string; name: string }[]
  const departments = (deptsData?.data ?? []) as { id: string; name: string }[]
  const designations = (desigsData?.data ?? []) as { id: string; name: string }[]

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success('Team member updated')
      setEditOpen(false)
    },
    onError: () => toast.error('Failed to update team member'),
  })

  function openEditDialog() {
    const m = data?.data as Record<string, unknown>
    if (!m) return
    setEditForm({
      name: (m.name as string) || '',
      email: (m.email as string) || '',
      mobile: (m.mobile as string) || '',
      role_id: (m.role_id as string) || '',
      designation_id: (m.designation_id as string) || '',
      department_id: (m.department_id as string) || '',
      status: (m.status as string) || 'active',
      join_date: (m.join_date as string)?.split('T')[0] || '',
      salary: m.salary != null ? String(m.salary) : '',
    })
    setEditOpen(true)
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate({
      name: editForm.name,
      email: editForm.email,
      mobile: editForm.mobile || undefined,
      role_id: editForm.role_id || undefined,
      designation_id: editForm.designation_id || undefined,
      department_id: editForm.department_id || undefined,
      status: editForm.status,
      join_date: editForm.join_date || undefined,
      salary: editForm.salary ? Number(editForm.salary) : undefined,
    })
  }

  if (isLoading) return <DetailSkeleton />

  const member = data?.data as Record<string, unknown> | undefined
  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Team member not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/team')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Team
        </Button>
      </div>
    )
  }

  const name = member.name as string
  const status = member.status as string
  const department = member.departments as Record<string, string> | null
  const designation = member.designations as Record<string, string> | null
  const role = member.roles as Record<string, string> | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/team')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
            <p className="text-sm text-muted-foreground">{designation?.name || 'Team Member'}</p>
          </div>
          <Badge variant="secondary" className={statusColors[status] || ''}>
            {status?.replace(/_/g, ' ')}
          </Badge>
        </div>
        <Button onClick={openEditDialog}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0">
              <div className="space-y-0 divide-y">
                <InfoRow icon={User} label="Full Name" value={name} />
                <InfoRow icon={Mail} label="Email" value={member.email as string} />
                <InfoRow icon={Phone} label="Mobile" value={member.mobile as string} />
                <InfoRow
                  icon={Briefcase}
                  label="Role"
                  value={role ? <Badge variant="secondary">{role.name}</Badge> : '-'}
                />
              </div>
              <div className="space-y-0 divide-y sm:pl-6">
                <InfoRow icon={Briefcase} label="Designation" value={designation?.name} />
                <InfoRow icon={Building2} label="Department" value={department?.name} />
                <InfoRow
                  icon={Calendar}
                  label="Join Date"
                  value={member.join_date ? format(new Date(member.join_date as string), 'dd MMM yyyy') : '-'}
                />
                <InfoRow
                  icon={IndianRupee}
                  label="Salary"
                  value={formatINR(member.salary as number)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="space-y-4">
          <StatCard
            icon={ClipboardList}
            label="Tasks Assigned"
            value={(member.tasks_assigned as number) ?? 0}
            color="bg-primary"
          />
          <StatCard
            icon={CheckCircle2}
            label="Tasks Completed"
            value={(member.tasks_completed as number) ?? 0}
            color="bg-green-600"
          />
          <StatCard
            icon={Clock}
            label="Hours Logged This Month"
            value={(member.hours_logged_this_month as number) ?? 0}
            color="bg-purple-600"
          />
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Name *</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editForm.role_id} onValueChange={(v) => setEditForm({ ...editForm, role_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={editForm.department_id} onValueChange={(v) => setEditForm({ ...editForm, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Select value={editForm.designation_id} onValueChange={(v) => setEditForm({ ...editForm, designation_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Join Date</Label>
                <Input type="date" value={editForm.join_date} onChange={(e) => setEditForm({ ...editForm, join_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Salary</Label>
                <Input type="number" value={editForm.salary} onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} />
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
