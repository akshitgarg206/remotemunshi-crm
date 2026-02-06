'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
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
  const [steps, setSteps] = useState<string[]>([])
  const [reviewer1, setReviewer1] = useState<string>('')
  const [reviewer2, setReviewer2] = useState<string>('')

  const { data: teamData } = useQuery({
    queryKey: ['team-for-reviewers'],
    queryFn: () => apiFetch('/api/v1/team?pageSize=500'),
  })
  const employees = ((teamData?.data as Record<string, unknown>[]) || [])

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: 'pending',
      priority: 'medium',
      parent_task_id: parentTaskId,
    },
  })

  const onSubmit = async (data: CreateTaskInput) => {
    // Add checklist items (steps) to the data
    const checklist = steps
      .map((s) => s.trim())
      .filter(Boolean)
      .map((title, i) => ({ title, sort_order: i }))

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
    setSteps([...steps, ''])
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index))
  }

  function updateStep(index: number, value: string) {
    const updated = [...steps]
    updated[index] = value
    setSteps(updated)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {parentTaskId ? 'Add Sub-Task' : 'Add Task'}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Task Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label>Task Name *</Label>
              <Input {...register('task_name')} />
              {errors.task_name && <p className="text-sm text-red-500">{errors.task_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select defaultValue="medium" onValueChange={(v) => setValue('priority', v as CreateTaskInput['priority'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" {...register('due_date')} />
            </div>
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input type="number" step="0.5" {...register('estimated_hours', { valueAsNumber: true })} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Steps Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Steps
              <Button type="button" size="sm" variant="outline" onClick={addStep}>
                <Plus className="mr-1 size-4" /> Add Step
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No steps added yet. Steps help break down the task into smaller actions.</p>
            ) : (
              steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                  <Input
                    placeholder={`Step ${i + 1}`}
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeStep(i)}>
                    <X className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Review Configuration */}
        {!parentTaskId && (
          <Card>
            <CardHeader>
              <CardTitle>Review (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : parentTaskId ? 'Create Sub-Task' : 'Create Task'}</Button>
        </div>
      </form>
    </div>
  )
}
