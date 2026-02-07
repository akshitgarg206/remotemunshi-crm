'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, Play, Power, Pencil, ListChecks, Users, ShieldCheck } from 'lucide-react'
import { useTaskTemplate, useUpdateTaskTemplate, useDeleteTaskTemplate, useGenerateFromTemplate } from '@/hooks/queries/use-task-templates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const frequencyLabels: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', half_yearly: 'Half Yearly', yearly: 'Yearly',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700', medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
}

interface ChecklistItem { title: string; sort_order: number }
interface AssigneeData { employee_id: string; employees: { id: string; name: string; avatar_url?: string } }

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: res, isLoading } = useTaskTemplate(id)
  const updateTemplate = useUpdateTaskTemplate(id)
  const deleteTemplate = useDeleteTaskTemplate(id)
  const generateFromTemplate = useGenerateFromTemplate(id)
  const [genOpen, setGenOpen] = useState(false)
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(new Date().getFullYear())

  const template = res?.data as Record<string, unknown> | undefined
  const isOnboarding = template?.trigger_type === 'onboarding'

  async function handleToggleActive() {
    try {
      await updateTemplate.mutateAsync({ is_active: !template?.is_active })
      toast.success(template?.is_active ? 'Template deactivated' : 'Template activated')
    } catch {
      toast.error('Failed to update template')
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this template? This cannot be undone.')) return
    try {
      await deleteTemplate.mutateAsync()
      toast.success('Template deleted')
      router.push('/task/templates')
    } catch {
      toast.error('Failed to delete template')
    }
  }

  async function handleGenerate() {
    try {
      const result = await generateFromTemplate.mutateAsync({ month: genMonth, year: genYear })
      const data = result.data as Record<string, unknown>
      toast.success(`Created ${data.tasks_created} tasks for ${data.period}`)
      setGenOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate tasks')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">Template not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/task/templates')}>
          <ArrowLeft className="mr-2 size-4" /> Back to Templates
        </Button>
      </div>
    )
  }

  const checklist = (template.checklist_template as ChecklistItem[]) || []
  const assignees = (template.recurring_task_assignees as AssigneeData[]) || []
  const reviewer1 = template.reviewer_1 as { id: string; name: string } | null
  const reviewer2 = template.reviewer_2 as { id: string; name: string } | null
  const service = template.services as { name: string } | null
  const client = template.clients as { business_name: string } | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/task/templates')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{template.task_name as string}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={isOnboarding ? 'default' : 'secondary'}>
                {isOnboarding ? 'Onboarding' : 'Recurring'}
              </Badge>
              {!isOnboarding && template.frequency ? (
                <Badge variant="secondary">{frequencyLabels[template.frequency as string] || (template.frequency as string)}</Badge>
              ) : null}
              <Badge variant="secondary" className={priorityColors[template.priority as string] || ''}>
                {template.priority as string}
              </Badge>
              <Badge variant="secondary" className={template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                {template.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isOnboarding && (
            <Button variant="outline" size="sm" onClick={() => setGenOpen(true)}>
              <Play className="mr-1 size-4" /> Generate Tasks
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleToggleActive}>
            <Power className="mr-1 size-4" /> {template.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/task/templates/add?clone=${id}`)}>
            <Pencil className="mr-1 size-4" /> Edit
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader><CardTitle>Template Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium">{service?.name || (isOnboarding ? 'All new clients (universal)' : '-')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{client?.business_name || 'All subscribed clients'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isOnboarding ? 'Trigger' : 'Schedule'}</p>
              <p className="font-medium">
                {isOnboarding ? (
                  'On client creation'
                ) : (
                  <>
                    {template.day_of_month ? `Day ${template.day_of_month}` : ''}
                    {template.month_of_year ? ` of Month ${template.month_of_year}` : ''}
                    {!template.day_of_month && !template.month_of_year ? '-' : ''}
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Hours</p>
              <p className="font-medium">{(template.estimated_hours as number) ?? '-'}</p>
            </div>
            {!isOnboarding && (
              <div>
                <p className="text-sm text-muted-foreground">Last Generated</p>
                <p className="font-medium">
                  {template.last_generated_at
                    ? format(new Date(template.last_generated_at as string), 'dd MMM yyyy')
                    : 'Never'}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Min Edit Level</p>
              <p className="font-medium">{String(template.min_edit_level)}</p>
            </div>
          </div>
          {typeof template.description === 'string' && template.description && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1">{template.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-5" /> Default Steps ({checklist.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">No default steps configured.</p>
          ) : (
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-6">{i + 1}.</span>
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignees + Reviewers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" /> Default Assignees ({assignees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No default assignees.</p>
            ) : (
              <div className="space-y-2">
                {assignees.map((a) => (
                  <div key={a.employee_id} className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {a.employees?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="text-sm">{a.employees?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" /> Default Reviewers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Level 1 Reviewer</p>
              <p className="font-medium">{reviewer1?.name || 'None'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level 2 Reviewer</p>
              <p className="font-medium">{reviewer2?.name || 'None'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Button */}
      <div className="flex justify-end">
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          Delete Template
        </Button>
      </div>

      {/* Generate Dialog — only for recurring templates */}
      {!isOnboarding && (
        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Generate Tasks from Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={genMonth}
                    onChange={(e) => setGenMonth(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    min={2020}
                    max={2100}
                    value={genYear}
                    onChange={(e) => setGenYear(Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will create tasks for all subscribed clients using this template&apos;s steps, assignees, and reviewers.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={generateFromTemplate.isPending}>
                {generateFromTemplate.isPending ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
