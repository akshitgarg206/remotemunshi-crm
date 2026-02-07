'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Pencil, Trash2, Shield } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

// --- Types ---

interface Role {
  id: string
  name: string
  description: string
  user_count: number
  permissions: Record<string, string[]>
  created_at: string
}

const MODULES = [
  'clients',
  'leads',
  'services',
  'tasks',
  'dscs',
  'licenses',
  'passwords',
  'documents',
  'compliance',
  'notices',
  'bundles',
  'communications',
  'team',
  'attendance',
  'leave',
  'settings',
  'api_keys',
  'webhooks',
  'chat',
  'calendar',
  'sprints',
  'reports',
] as const

const ACTIONS = ['view', 'create', 'edit', 'delete'] as const

type Module = (typeof MODULES)[number]
type Action = (typeof ACTIONS)[number]

const emptyForm = { name: '', description: '' }

function buildEmptyPermissions(): Record<Module, Action[]> {
  return Object.fromEntries(MODULES.map((m) => [m, []])) as unknown as Record<Module, Action[]>
}

// --- Component ---

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<Record<Module, Action[]>>(buildEmptyPermissions())

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'roles'],
    queryFn: () => apiFetch('/api/v1/settings/roles'),
  })
  const roles = (data?.data as Role[] | undefined) || []

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) =>
      apiFetch('/api/v1/settings/roles', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] })
      toast.success('Role created')
      closeDialog()
    },
    onError: () => toast.error('Failed to create role'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof emptyForm & { id: string }) =>
      apiFetch(`/api/v1/settings/roles/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] })
      toast.success('Role updated')
      closeDialog()
    },
    onError: () => toast.error('Failed to update role'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/settings/roles/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] })
      toast.success('Role deleted')
      if (selectedRoleId === deletedId) {
        setSelectedRoleId(null)
        setPermissions(buildEmptyPermissions())
      }
    },
    onError: () => toast.error('Failed to delete role'),
  })

  const permissionMutation = useMutation({
    mutationFn: (data: { roleId: string; permissions: Record<Module, Action[]> }) =>
      apiFetch(`/api/v1/settings/roles/${data.roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: data.permissions }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] })
      toast.success('Permissions updated')
    },
    onError: () => toast.error('Failed to update permissions'),
  })

  function closeDialog() {
    setOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function openEdit(role: Role) {
    setEditingId(role.id)
    setForm({ name: role.name, description: role.description })
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

  function selectRole(role: Role) {
    setSelectedRoleId(role.id)
    const perms = buildEmptyPermissions()
    if (role.permissions) {
      for (const mod of MODULES) {
        if (role.permissions[mod]) {
          perms[mod] = role.permissions[mod] as Action[]
        }
      }
    }
    setPermissions(perms)
  }

  function togglePermission(mod: Module, action: Action) {
    setPermissions((prev) => {
      const current = prev[mod] || []
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action]
      return { ...prev, [mod]: next }
    })
  }

  function savePermissions() {
    if (!selectedRoleId) return
    permissionMutation.mutate({ roleId: selectedRoleId, permissions })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const selectedRole = roles?.find((r) => r.id === selectedRoleId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">Manage access control for your team</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Role' : 'Add Role'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Admin, Manager, Viewer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What this role can do"
                  rows={3}
                />
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

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !roles?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No roles found.</p>
              <p className="text-sm mt-1">Click &ldquo;Add Role&rdquo; to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className={selectedRoleId === role.id ? 'bg-muted/50' : 'cursor-pointer hover:bg-muted/30'}
                    onClick={() => selectRole(role)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[250px] truncate">
                      {role.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.user_count ?? 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); openEdit(role) }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this role?')) deleteMutation.mutate(role.id)
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

      {/* Permission Matrix */}
      {selectedRole && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Permission Matrix</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Editing permissions for <span className="font-medium text-foreground">{selectedRole.name}</span>
              </p>
            </div>
            <Button
              onClick={savePermissions}
              disabled={permissionMutation.isPending}
            >
              {permissionMutation.isPending ? 'Saving...' : 'Save Permissions'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Module</TableHead>
                    {ACTIONS.map((action) => (
                      <TableHead key={action} className="text-center capitalize w-[100px]">
                        {action}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map((mod) => (
                    <TableRow key={mod}>
                      <TableCell className="font-medium capitalize">{mod}</TableCell>
                      {ACTIONS.map((action) => {
                        const checked = permissions[mod]?.includes(action) ?? false
                        return (
                          <TableCell key={action} className="text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(mod, action)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
