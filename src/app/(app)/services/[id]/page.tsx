'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Bell,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Users,
  ListTodo,
  Repeat,
  Package,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/empty-state'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'

/* eslint-disable @typescript-eslint/no-explicit-any */

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || '-'}</dd>
    </div>
  )
}

function formatFrequency(freq: string | null | undefined): string {
  if (!freq) return '-'
  return freq.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

interface EditForm {
  name: string
  description: string
  frequency: string
  due_day_of_month: string
  requires_data_collection: boolean
  data_description: string
  is_active: boolean
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', description: '', frequency: '', due_day_of_month: '',
    requires_data_collection: false, data_description: '', is_active: true,
  })

  const { data: serviceRes, isLoading } = useQuery({
    queryKey: ['services', id],
    queryFn: () => apiFetch(`/api/v1/services/${id}`),
    enabled: !!id,
  })
  const service = (serviceRes as any)?.data as Record<string, any> | undefined

  const { data: assocRes, isLoading: assocLoading } = useQuery({
    queryKey: ['services', id, 'associations'],
    queryFn: () => apiFetch(`/api/v1/services/${id}/associations`),
    enabled: !!id,
  })
  const assoc = (assocRes as any)?.data as {
    clients: any[]; tasks: any[]; templates: any[]; bundles: any[]
  } | undefined

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', id] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service updated')
      setEditOpen(false)
    },
    onError: () => toast.error('Failed to update service'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/services/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service deleted')
      router.push('/services')
    },
    onError: (err: any) => {
      const msg = err?.error?.message || err?.message || 'Failed to delete service'
      toast.error(msg)
    },
  })

  function openEditDialog() {
    if (!service) return
    setEditForm({
      name: service.name || '',
      description: service.description || '',
      frequency: service.frequency || '',
      due_day_of_month: service.due_day_of_month != null ? String(service.due_day_of_month) : '',
      requires_data_collection: service.requires_data_collection === true,
      data_description: service.data_description || '',
      is_active: service.is_active !== false,
    })
    setEditOpen(true)
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      name: editForm.name,
      description: editForm.description || undefined,
      is_active: editForm.is_active,
    }
    if (editForm.frequency) {
      payload.frequency = editForm.frequency
      if (editForm.due_day_of_month) payload.due_day_of_month = Number(editForm.due_day_of_month)
      payload.requires_data_collection = editForm.requires_data_collection
      if (editForm.requires_data_collection && editForm.data_description) {
        payload.data_description = editForm.data_description
      }
    } else {
      payload.frequency = undefined
      payload.due_day_of_month = undefined
      payload.requires_data_collection = false
      payload.data_description = undefined
    }
    updateMutation.mutate(payload)
  }

  function handleDelete() {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) return
    deleteMutation.mutate()
  }

  if (isLoading) {
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

  if (!service) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/services')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
        </Button>
        <div className="text-center py-12 text-muted-foreground">Service not found</div>
      </div>
    )
  }

  const isActive = service.is_active !== false
  const category = service.service_categories as Record<string, string> | null
  const hasDeadlineSettings = !!service.frequency
  const reminderDays = service.reminder_days as number[] | null
  const messageTemplates = service.message_templates as Record<string, string> | null

  const clientCount = assoc?.clients?.length ?? 0
  const taskCount = assoc?.tasks?.length ?? 0
  const templateCount = assoc?.templates?.length ?? 0
  const bundleCount = assoc?.bundles?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/services')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{service.name}</h1>
              <Badge
                variant="secondary"
                className={isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}
              >
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="mr-2 h-4 w-4" /> {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Name" value={service.name} />
            <DetailField label="Category" value={category?.name ? <Badge variant="secondary">{category.name}</Badge> : '-'} />
            <DetailField label="Description" value={service.description} />
          </dl>
        </CardContent>
      </Card>

      {/* Deadline Settings Card */}
      {hasDeadlineSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Deadline Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Frequency" value={formatFrequency(service.frequency)} />
              <DetailField
                label="Due Day of Month"
                value={service.due_day_of_month ? `${service.due_day_of_month}${getOrdinalSuffix(service.due_day_of_month)}` : '-'}
              />
              <DetailField
                label="Reminder Days"
                value={reminderDays?.length ? reminderDays.join(', ') + ' days before due' : '-'}
              />
              <DetailField
                label="Requires Data Collection"
                value={service.requires_data_collection ? 'Yes' : 'No'}
              />
              <DetailField label="Data Description" value={service.data_description} />
            </dl>

            {messageTemplates && Object.keys(messageTemplates).length > 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setTemplatesOpen(!templatesOpen)}
                >
                  <Bell className="h-4 w-4" />
                  Message Templates
                  {templatesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {templatesOpen && (
                  <div className="mt-3 space-y-3">
                    {Object.entries(messageTemplates).map(([key, value]) => (
                      <div key={key} className="rounded-md border p-3">
                        <div className="text-xs font-medium text-muted-foreground capitalize mb-1">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{value as string}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Associations Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="clients">
            <TabsList variant="line" className="w-full justify-start mb-4">
              <TabsTrigger value="clients" className="gap-1.5">
                <Users className="h-4 w-4" />
                Clients
                {clientCount > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">{clientCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1.5">
                <ListTodo className="h-4 w-4" />
                Tasks
                {taskCount > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">{taskCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-1.5">
                <Repeat className="h-4 w-4" />
                Templates
                {templateCount > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">{templateCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="bundles" className="gap-1.5">
                <Package className="h-4 w-4" />
                Bundles
                {bundleCount > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">{bundleCount}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              {assocLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
              ) : clientCount === 0 ? (
                <EmptyState variant="no-data" title="No clients" description="No clients are currently using this service." className="py-10" />
              ) : (
                <div className="divide-y rounded-md border">
                  {assoc!.clients.map((client: any) => (
                    <button
                      key={client.id}
                      onClick={() => router.push(`/client/${client.id}`)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="font-medium text-sm">{client.name}</span>
                        {client.code && <span className="ml-2 text-xs text-muted-foreground">{client.code}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={client.is_active !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}>
                          {client.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks">
              {assocLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
              ) : taskCount === 0 ? (
                <EmptyState variant="no-data" title="No tasks" description="No tasks are linked to this service." className="py-10" />
              ) : (
                <div className="divide-y rounded-md border">
                  {assoc!.tasks.map((task: any) => (
                    <button
                      key={task.id}
                      onClick={() => router.push(`/task/${task.id}`)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <span className="font-medium text-sm truncate block">{task.title}</span>
                        {task.clients?.name && <span className="text-xs text-muted-foreground">{task.clients.name}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className={statusColors[task.status] || ''}>
                          {(task.status || '').replace(/_/g, ' ')}
                        </Badge>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates">
              {assocLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
              ) : templateCount === 0 ? (
                <EmptyState variant="no-data" title="No templates" description="No task templates are linked to this service." className="py-10" />
              ) : (
                <div className="divide-y rounded-md border">
                  {assoc!.templates.map((tmpl: any) => (
                    <button
                      key={tmpl.id}
                      onClick={() => router.push(`/task/templates/${tmpl.id}`)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="font-medium text-sm">{tmpl.task_name}</span>
                        {tmpl.frequency && <span className="ml-2 text-xs text-muted-foreground capitalize">{tmpl.frequency.replace(/_/g, ' ')}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={tmpl.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}>
                          {tmpl.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bundles">
              {assocLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
              ) : bundleCount === 0 ? (
                <EmptyState variant="no-data" title="No bundles" description="This service is not part of any bundles." className="py-10" />
              ) : (
                <div className="divide-y rounded-md border">
                  {assoc!.bundles.map((bundle: any) => (
                    <button
                      key={bundle.id}
                      onClick={() => router.push(`/bundles/${bundle.id}`)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-sm">{bundle.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={bundle.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}>
                          {bundle.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={editForm.frequency || '__none__'}
                onValueChange={(v) => {
                  const freq = v === '__none__' ? '' : v
                  setEditForm({ ...editForm, frequency: freq, due_day_of_month: freq ? editForm.due_day_of_month : '' })
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            {editForm.frequency && (
              <div className="space-y-2">
                <Label>Due Day of Month (1-31)</Label>
                <Input
                  type="number" min={1} max={31}
                  value={editForm.due_day_of_month}
                  onChange={(e) => setEditForm({ ...editForm, due_day_of_month: e.target.value })}
                  placeholder="e.g. 15"
                />
              </div>
            )}
            {editForm.frequency && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_requires_data"
                  checked={editForm.requires_data_collection}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, requires_data_collection: !!checked })}
                />
                <Label htmlFor="edit_requires_data" className="cursor-pointer">Requires Data Collection</Label>
              </div>
            )}
            {editForm.frequency && editForm.requires_data_collection && (
              <div className="space-y-2">
                <Label>Data Description</Label>
                <Input
                  value={editForm.data_description}
                  onChange={(e) => setEditForm({ ...editForm, data_description: e.target.value })}
                  placeholder="e.g. Monthly sales & purchase data"
                />
              </div>
            )}
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

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
