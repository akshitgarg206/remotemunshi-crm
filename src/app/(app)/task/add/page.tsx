'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, X, GripVertical } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createTaskSchema, type CreateTaskInput } from '@/lib/validators/tasks'
import { useCreateTask } from '@/hooks/queries/use-tasks'
import { apiFetch } from '@/lib/api/fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TASK_PRIORITY } from '@/types/enums'

const priorityDots: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

export default function AddTaskPage() {
  return (
    <Suspense>
      <AddTaskForm />
    </Suspense>
  )
}

function AddTaskForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const parentTaskId = searchParams.get('parent_task_id') || undefined
  const createTask = useCreateTask()
  const [steps, setSteps] = useState<{ title: string; owner_type: 'team' | 'client' }[]>([])
  const [reviewer1, setReviewer1] = useState<string>('')
  const [reviewer2, setReviewer2] = useState<string>('')
  const [estHours, setEstHours] = useState('')
  const [estMinutes, setEstMinutes] = useState('')

  const { data: teamData } = useQuery({
    queryKey: ['team-for-reviewers'],
    queryFn: () => apiFetch('/api/v1/team?pageSize=500'),
  })
  const employees = ((teamData?.data as Record<string, unknown>[]) || [])

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: 'pending',
      priority: 'medium',
      parent_task_id: parentTaskId,
    },
  })

  const currentPriority = watch('priority') || 'medium'

  const onSubmit = async (data: CreateTaskInput) => {
    const checklist = steps
      .filter((s) => s.title.trim())
      .map((s, i) => ({ title: s.title.trim(), sort_order: i, owner_type: s.owner_type }))

    // Convert h + m to decimal hours
    const h = parseInt(estHours) || 0
    const m = parseInt(estMinutes) || 0
    const totalDecimalHours = h + m / 60
    if (totalDecimalHours > 0) {
      data.estimated_hours = Math.round(totalDecimalHours * 100) / 100
    }

    try {
      await createTask.mutateAsync({
        ...data,
        reviewer_1_id: (reviewer1 && reviewer1 !== 'none') ? reviewer1 : undefined,
        reviewer_2_id: (reviewer2 && reviewer2 !== 'none') ? reviewer2 : undefined,
        checklist: checklist.length ? checklist : undefined,
      })
      toast.success(parentTaskId ? 'Sub-task created' : 'Task created')
      router.push(parentTaskId ? `/task/${parentTaskId}` : '/task')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  function addStep() {
    setSteps([...steps, { title: '', owner_type: 'team' }])
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index))
  }

  function updateStep(index: number, title: string) {
    const updated = [...steps]
    updated[index] = { ...updated[index], title }
    setSteps(updated)
  }

  function toggleStepOwner(index: number) {
    const updated = [...steps]
    updated[index] = { ...updated[index], owner_type: updated[index].owner_type === 'team' ? 'client' : 'team' }
    setSteps(updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {parentTaskId ? 'Add Sub-Task' : 'Add Task'}
        </h1>
        <p className="text-muted-foreground">Fill in the details to create a new task</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Task Name — Full Width, Prominent */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Task Name *</Label>
          <Input
            {...register('task_name')}
            className="text-lg h-12"
            placeholder="What needs to be done?"
          />
          {errors.task_name && <p className="text-sm text-red-500">{errors.task_name.message}</p>}
        </div>

        {/* 2-Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column — Wide (Details + Steps) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Add details, instructions, or context for this task..."
                />
              </CardContent>
            </Card>

            {/* Checklist / Steps */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Checklist Steps</CardTitle>
                  <Button type="button" size="sm" variant="outline" onClick={addStep}>
                    <Plus className="mr-1 size-4" /> Add Step
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {steps.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No steps added yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Steps help break down the task into smaller actions.</p>
                  </div>
                ) : (
                  steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <GripVertical className="size-4 text-muted-foreground/50 shrink-0" />
                      <span className="text-sm text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                      <Input
                        placeholder={`Step ${i + 1}`}
                        value={step.title}
                        onChange={(e) => updateStep(i, e.target.value)}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => toggleStepOwner(i)}
                        className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                          step.owner_type === 'client'
                            ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                            : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                        }`}
                        title={step.owner_type === 'client' ? 'Client responsibility — click to change to Team' : 'Team responsibility — click to change to Client'}
                      >
                        {step.owner_type === 'client' ? 'Client' : 'Team'}
                      </button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => removeStep(i)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column — Narrow (Metadata) */}
          <div className="space-y-6">
            {/* Priority & Due Date */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select defaultValue="medium" onValueChange={(v) => setValue('priority', v as CreateTaskInput['priority'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITY.map((p) => (
                        <SelectItem key={p} value={p}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block size-2 rounded-full ${priorityDots[p] || 'bg-gray-400'}`} />
                            <span className="capitalize">{p}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Priority indicator */}
                  <div className={`h-1 w-full rounded-full ${priorityDots[currentPriority] || 'bg-gray-400'} opacity-50`} />
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" {...register('start_date')} />
                </div>

                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input type="date" {...register('target_date')} />
                  <p className="text-[11px] text-muted-foreground">Internal goal to finish before due date</p>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" {...register('due_date')} />
                  <p className="text-[11px] text-muted-foreground">Statutory / regulatory deadline</p>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Time</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number" min="0" max="999" placeholder="0"
                      value={estHours} onChange={(e) => setEstHours(e.target.value)}
                      className="w-16"
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                    <Input
                      type="number" min="0" max="59" step="5" placeholder="0"
                      value={estMinutes} onChange={(e) => setEstMinutes(e.target.value)}
                      className="w-16"
                    />
                    <span className="text-xs text-muted-foreground">m</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Configuration */}
            {!parentTaskId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Level 1 Reviewer</Label>
                    <Select value={reviewer1} onValueChange={(v) => { setReviewer1(v); if (!v) setReviewer2('') }}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {employees.map((e) => (
                          <SelectItem key={e.id as string} value={e.id as string}>{e.name as string}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Task must be reviewed before completion</p>
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
                      <p className="text-xs text-muted-foreground">Second review after L1 approval</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : parentTaskId ? 'Create Sub-Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>
  )
}
