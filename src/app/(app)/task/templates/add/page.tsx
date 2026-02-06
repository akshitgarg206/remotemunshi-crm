'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createTaskTemplateSchema, type CreateTaskTemplateInput } from '@/lib/validators/task-templates'
import { useCreateTaskTemplate } from '@/hooks/queries/use-task-templates'
import { apiFetch } from '@/lib/api/fetch'
import { TASK_PRIORITY, RECURRENCE_FREQUENCY } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

const frequencyLabels: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', half_yearly: 'Half Yearly', yearly: 'Yearly',
}

export default function AddTemplatePage() {
  return (
    <Suspense>
      <AddTemplateForm />
    </Suspense>
  )
}

function AddTemplateForm() {
  const router = useRouter()
  const createTemplate = useCreateTaskTemplate()
  const [steps, setSteps] = useState<string[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [reviewer1, setReviewer1] = useState<string>('')
  const [reviewer2, setReviewer2] = useState<string>('')

  const { data: teamData } = useQuery({
    queryKey: ['team-for-templates'],
    queryFn: () => apiFetch('/api/v1/team?pageSize=500'),
  })
  const employees = ((teamData?.data as Record<string, unknown>[]) || [])

  const { data: servicesData } = useQuery({
    queryKey: ['services-for-templates'],
    queryFn: () => apiFetch('/api/v1/services?pageSize=500'),
  })
  const services = ((servicesData?.data as Record<string, unknown>[]) || [])

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateTaskTemplateInput>({
    resolver: zodResolver(createTaskTemplateSchema),
    defaultValues: {
      priority: 'medium',
      frequency: 'monthly',
      is_active: true,
      checklist_template: [],
    },
  })

  const frequency = watch('frequency')

  const onSubmit = async (data: CreateTaskTemplateInput) => {
    const checklist = steps
      .map((s) => s.trim())
      .filter(Boolean)
      .map((title, i) => ({ title, sort_order: i }))

    try {
      await createTemplate.mutateAsync({
        ...data,
        checklist_template: checklist,
        assignee_ids: selectedAssignees.length ? selectedAssignees : undefined,
        reviewer_1_id: (reviewer1 && reviewer1 !== 'none') ? reviewer1 : undefined,
        reviewer_2_id: (reviewer2 && reviewer2 !== 'none') ? reviewer2 : undefined,
      })
      toast.success('Template created')
      router.push('/task/templates')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create template')
    }
  }

  function toggleAssignee(id: string) {
    setSelectedAssignees(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Create Task Template</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Template Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label>Template Name *</Label>
              <Input {...register('task_name')} placeholder="e.g. GSTR1 Filing" />
              {errors.task_name && <p className="text-sm text-red-500">{errors.task_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <Select onValueChange={(v) => setValue('service_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id as string} value={s.id as string}>{s.name as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select defaultValue="medium" onValueChange={(v) => setValue('priority', v as CreateTaskTemplateInput['priority'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input type="number" step="0.5" {...register('estimated_hours', { valueAsNumber: true })} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} placeholder="What does this template do?" />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Frequency *</Label>
              <Select defaultValue="monthly" onValueChange={(v) => setValue('frequency', v as CreateTaskTemplateInput['frequency'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_FREQUENCY.map((f) => (
                    <SelectItem key={f} value={f}>{frequencyLabels[f] || f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.frequency && <p className="text-sm text-red-500">{errors.frequency.message}</p>}
            </div>
            {(frequency === 'monthly' || frequency === 'quarterly' || frequency === 'half_yearly' || frequency === 'yearly') && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Input type="number" min={1} max={31} {...register('day_of_month', { valueAsNumber: true })} placeholder="1-31" />
              </div>
            )}
            {frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Day of Week (0=Sun, 6=Sat)</Label>
                <Input type="number" min={0} max={6} {...register('day_of_week', { valueAsNumber: true })} />
              </div>
            )}
            {frequency === 'yearly' && (
              <div className="space-y-2">
                <Label>Month of Year (1-12)</Label>
                <Input type="number" min={1} max={12} {...register('month_of_year', { valueAsNumber: true })} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Default Steps
              <Button type="button" size="sm" variant="outline" onClick={() => setSteps([...steps, ''])}>
                <Plus className="mr-1 size-4" /> Add Step
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No steps added. Tasks created from this template will start with an empty checklist.</p>
            ) : (
              steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                  <Input
                    placeholder={`Step ${i + 1}`}
                    value={step}
                    onChange={(e) => {
                      const updated = [...steps]
                      updated[i] = e.target.value
                      setSteps(updated)
                    }}
                    className="flex-1"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                    <X className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Default Assignees */}
        <Card>
          <CardHeader><CardTitle>Default Assignees</CardTitle></CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading team members...</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {employees.map((e) => (
                  <label key={e.id as string} className="flex items-center gap-2 cursor-pointer rounded-lg border p-2 hover:bg-muted/50">
                    <Checkbox
                      checked={selectedAssignees.includes(e.id as string)}
                      onCheckedChange={() => toggleAssignee(e.id as string)}
                    />
                    <span className="text-sm">{e.name as string}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Default Reviewers */}
        <Card>
          <CardHeader><CardTitle>Default Reviewers (Optional)</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Level 1 Reviewer</Label>
              <Select value={reviewer1} onValueChange={(v) => { setReviewer1(v); if (!v || v === 'none') setReviewer2('') }}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id as string} value={e.id as string}>{e.name as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reviewer1 && reviewer1 !== 'none' && (
              <div className="space-y-2">
                <Label>Level 2 Reviewer</Label>
                <Select value={reviewer2} onValueChange={setReviewer2}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {employees
                      .filter((e) => (e.id as string) !== reviewer1)
                      .map((e) => (
                        <SelectItem key={e.id as string} value={e.id as string}>{e.name as string}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Template'}</Button>
        </div>
      </form>
    </div>
  )
}
