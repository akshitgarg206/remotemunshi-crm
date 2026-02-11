'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { UsersRound } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/fetch'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  on_leave: 'bg-yellow-100 text-yellow-700',
  terminated: 'bg-red-100 text-red-700',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'name', header: 'Name', cell: ({ row }) => {
      const name = row.getValue('name') as string
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      )
    },
  },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'mobile', header: 'Mobile' },
  { accessorKey: 'departments', header: 'Department', cell: ({ row }) => (row.getValue('departments') as Record<string, string>)?.name || '-' },
  { accessorKey: 'designations', header: 'Designation', cell: ({ row }) => (row.getValue('designations') as Record<string, string>)?.name || '-' },
  { accessorKey: 'roles', header: 'Role', cell: ({ row }) => { const r = (row.getValue('roles') as Record<string, string>); return r ? <Badge variant="secondary">{r.name}</Badge> : '-' } },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s = row.getValue('status') as string; return <Badge variant="secondary" className={statusColors[s]}>{s.replace(/_/g, ' ')}</Badge> } },
]

const emptyTeamForm = {
  name: '', email: '', password: '', mobile: '', role_id: '', designation_id: '',
  department_id: '', status: 'active', join_date: '', salary: '',
}

export default function TeamPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyTeamForm)

  const { data: rolesData } = useQuery({
    queryKey: ['settings', 'roles'],
    queryFn: () => apiFetch('/api/v1/settings/roles'),
  })
  const { data: deptsData } = useQuery({
    queryKey: ['settings', 'departments'],
    queryFn: () => apiFetch('/api/v1/settings/departments'),
  })
  const { data: desigsData } = useQuery({
    queryKey: ['settings', 'designations'],
    queryFn: () => apiFetch('/api/v1/settings/designations'),
  })
  const roles = (rolesData?.data ?? []) as { id: string; name: string }[]
  const departments = (deptsData?.data ?? []) as { id: string; name: string }[]
  const designations = (desigsData?.data ?? []) as { id: string; name: string }[]

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/team', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success('Team member added')
      setAddOpen(false)
      setForm(emptyTeamForm)
    },
    onError: () => toast.error('Failed to add team member'),
  })

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      password: form.password,
      mobile: form.mobile || undefined,
      role_id: form.role_id || undefined,
      designation_id: form.designation_id || undefined,
      department_id: form.department_id || undefined,
      status: form.status,
      join_date: form.join_date || undefined,
      salary: form.salary ? Number(form.salary) : undefined,
    }
    createMutation.mutate(payload)
  }

  const sp = new URLSearchParams()
  sp.set('page', String(page))
  sp.set('pageSize', '20')
  if (search) sp.set('search', search)
  if (statusFilter) sp.set('status', statusFilter)

  const { data, isLoading } = useQuery({
    queryKey: ['team', { page, search, status: statusFilter }],
    queryFn: () => apiFetch(`/api/v1/team?${sp.toString()}`),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">Manage your team members</p>
      </div>

      <Tabs defaultValue="" onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="on_leave">On Leave</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search team..."
        onSearch={setSearch}
        onAdd={() => setAddOpen(true)}
        addLabel="Add Member"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/team/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="team" open={importOpen} onOpenChange={setImportOpen} />

      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) { setAddOpen(false); setForm(emptyTeamForm) } else setAddOpen(true) }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Select value={form.designation_id} onValueChange={(v) => setForm({ ...form, designation_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Join Date</Label>
                <Input type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Salary</Label>
                <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="Monthly salary" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setForm(emptyTeamForm) }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
