'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Plus,
  Clock,
  CheckCircle2,
  MessageSquare,
  ListChecks,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import { apiFetch } from '@/lib/api/fetch'
import { useTask, useUpdateTask, useSubTasks, useCreateSubTask, useReviewTask } from '@/hooks/queries/use-tasks'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// --- Constants ---

import { StatusBadge } from '@/components/status-badge'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  in_review: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  request_changes: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
  on_hold: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

const priorityColors: Record<string, string> = {
  low: 'bg-green-500/10 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

const statusOptions = [
  'pending',
  'in_progress',
  'in_review',
  'request_changes',
  'completed',
  'on_hold',
  'cancelled',
]

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// --- Helpers ---

function formatMinutes(totalMinutes: number | null | undefined): string {
  if (!totalMinutes) return '-'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function decimalHoursToHM(hours: number | null | undefined): { h: number; m: number } {
  if (!hours) return { h: 0, m: 0 }
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return { h, m }
}

function formatDecimalHours(hours: number | null | undefined): string {
  if (hours == null) return '-'
  const { h, m } = decimalHoursToHM(hours)
  if (h === 0 && m === 0) return '-'
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// --- Types ---

interface ChecklistItem {
  id: string
  title: string
  is_checked: boolean
  estimated_minutes: number | null
  actual_minutes: number | null
}

interface TimeEntry {
  id: string
  employee_name?: string
  employees?: { name: string }
  date: string
  hours: number
  billable: boolean
}

interface Comment {
  id: string
  employee_name?: string
  employees?: { name: string }
  comment: string
  created_at: string
}

interface SubTaskData {
  id: string
  task_name: string
  status: string
  priority: string
  due_date: string | null
  task_assignees?: { employee_id: string; employees: { id: string; name: string } }[]
  task_checklist_items?: { id: string; title: string; is_checked: boolean; sort_order: number }[]
}

interface TaskData {
  id: string
  task_name: string
  status: string
  priority: string
  due_date: string | null
  estimated_hours: number | null
  created_at: string
  parent_task_id?: string | null
  clients?: { business_name: string } | null
  services?: { name: string } | null
  sub_tasks?: SubTaskData[]
  reviewer_1_id?: string | null
  reviewer_2_id?: string | null
  reviewer_1?: { id: string; name: string; avatar_url?: string } | null
  reviewer_2?: { id: string; name: string; avatar_url?: string } | null
  current_review_level?: number
  review_1_status?: string | null
  review_2_status?: string | null
  review_1_comment?: string | null
  review_2_comment?: string | null
  review_1_at?: string | null
  review_2_at?: string | null
}

// --- Component ---

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: taskResponse, isLoading } = useTask(id)
  const updateTask = useUpdateTask(id)
  const reviewTask = useReviewTask(id)
  const [reviewComment, setReviewComment] = useState('')

  const task = taskResponse?.data as TaskData | undefined

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    task_name: '', description: '', priority: 'medium', due_date: '', estH: '', estM: '',
  })

  function openEditDialog() {
    if (!task) return
    const { h, m } = decimalHoursToHM(task.estimated_hours)
    setEditForm({
      task_name: task.task_name || '',
      description: (task as any).description || '',
      priority: task.priority || 'medium',
      due_date: task.due_date?.split('T')[0] || '',
      estH: h > 0 ? String(h) : '',
      estM: m > 0 ? String(m) : '',
    })
    setEditOpen(true)
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    const h = parseInt(editForm.estH) || 0
    const m = parseInt(editForm.estM) || 0
    const totalDecimalHours = h + m / 60
    updateTask.mutate({
      task_name: editForm.task_name,
      description: editForm.description || undefined,
      priority: editForm.priority,
      due_date: editForm.due_date || undefined,
      estimated_hours: totalDecimalHours > 0 ? Math.round(totalDecimalHours * 100) / 100 : undefined,
    }, {
      onSuccess: () => {
        toast.success('Task updated')
        setEditOpen(false)
      },
      onError: () => toast.error('Failed to update task'),
    })
  }

  // Current user's employee ID (from auth API)
  const { data: meData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiFetch('/api/v1/auth/me'),
    staleTime: 5 * 60 * 1000,
  })
  const meEmployee = (meData?.data as Record<string, unknown>)?.employee as Record<string, unknown> | undefined
  const currentEmployeeId = meEmployee?.id as string | undefined

  const hasReviewers = !!(task?.reviewer_1_id)
  const isCurrentReviewer = task && currentEmployeeId && (
    (task.current_review_level === 1 && task.reviewer_1_id === currentEmployeeId) ||
    (task.current_review_level === 2 && task.reviewer_2_id === currentEmployeeId)
  )

  // Filter status options: block "Completed" if reviews are pending
  const filteredStatusOptions = hasReviewers
    ? statusOptions.filter((s) => {
        if (s === 'completed') {
          const r1Done = task?.review_1_status === 'approved'
          const r2Done = !task?.reviewer_2_id || task?.review_2_status === 'approved'
          return r1Done && r2Done
        }
        return true
      })
    : statusOptions

  // --- Status change ---

  async function handleStatusChange(newStatus: string) {
    try {
      await updateTask.mutateAsync({ status: newStatus })
      toast.success(`Status updated to ${formatLabel(newStatus)}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleReview(action: 'approve' | 'request_changes') {
    try {
      await reviewTask.mutateAsync({ action, comment: reviewComment || undefined })
      toast.success(action === 'approve' ? 'Task approved' : 'Changes requested')
      setReviewComment('')
    } catch {
      toast.error('Failed to submit review')
    }
  }

  // --- Loading ---

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">Task not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/task')}>
          <ArrowLeft className="mr-2 size-4" /> Back to Tasks
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(task.parent_task_id ? `/task/${task.parent_task_id}` : '/task')}
            title={task.parent_task_id ? 'Back to Parent Task' : 'Back to Tasks'}
            className="mt-1"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            {task.parent_task_id && (
              <Badge variant="outline" className="text-xs mb-1">Sub-task</Badge>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{task.task_name}</h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status} />
              <StatusBadge status={task.priority} />
              {task.clients?.business_name && (
                <Badge variant="outline" className="text-xs font-normal">
                  {task.clients.business_name}
                </Badge>
              )}
              {task.services?.name && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {task.services.name}
                </Badge>
              )}
              {task.due_date && (
                <span className={`text-xs ${new Date(task.due_date) < new Date() ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                  Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={openEditDialog}>
          <Pencil className="mr-2 size-4" /> Edit
        </Button>
      </div>

      {/* Task Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{task.clients?.business_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium">{task.services?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="mt-1 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredStatusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'in_review' && hasReviewers ? 'Submit for Review' : formatLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <Badge variant="secondary" className={`mt-1 ${priorityColors[task.priority] || ''}`}>
                {formatLabel(task.priority)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {task.due_date ? format(new Date(task.due_date), 'dd MMM yyyy') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Time</p>
              <p className="font-medium">{formatDecimalHours(task.estimated_hours)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">{format(new Date(task.created_at), 'dd MMM yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Status */}
      {hasReviewers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              Review Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.reviewer_1_id && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Level 1 Reviewer</p>
                  <p className="text-sm text-muted-foreground">{task.reviewer_1?.name || 'Unknown'}</p>
                </div>
                <Badge variant="secondary" className={
                  task.review_1_status === 'approved' ? 'bg-green-100 text-green-700' :
                  task.review_1_status === 'changes_requested' ? 'bg-red-100 text-red-700' :
                  task.current_review_level === 1 ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {task.review_1_status === 'approved' ? 'Approved' :
                   task.review_1_status === 'changes_requested' ? 'Changes Requested' :
                   task.current_review_level === 1 ? 'Pending Review' : 'Not Started'}
                </Badge>
              </div>
            )}
            {task.review_1_comment && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <span className="font-medium">L1 Comment:</span> {task.review_1_comment}
              </div>
            )}
            {task.reviewer_2_id && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Level 2 Reviewer</p>
                    <p className="text-sm text-muted-foreground">{task.reviewer_2?.name || 'Unknown'}</p>
                  </div>
                  <Badge variant="secondary" className={
                    task.review_2_status === 'approved' ? 'bg-green-100 text-green-700' :
                    task.review_2_status === 'changes_requested' ? 'bg-red-100 text-red-700' :
                    task.current_review_level === 2 ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }>
                    {task.review_2_status === 'approved' ? 'Approved' :
                     task.review_2_status === 'changes_requested' ? 'Changes Requested' :
                     task.current_review_level === 2 ? 'Pending Review' : 'Waiting for L1'}
                  </Badge>
                </div>
                {task.review_2_comment && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <span className="font-medium">L2 Comment:</span> {task.review_2_comment}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Action — shown to the active reviewer */}
      {task.status === 'in_review' && isCurrentReviewer && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <ShieldCheck className="size-5" />
              Review Required (Level {task.current_review_level})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-800">
              This task is pending your review. You can add review checklist items below before approving.
            </p>

            {/* Inline checklist for reviewer to add review steps */}
            <ReviewChecklistSection taskId={id} />

            <div className="space-y-2">
              <label className="text-sm font-medium">Review Comment (Optional)</label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add feedback or instructions..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleReview('approve')}
                disabled={reviewTask.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 size-4" /> Approve
              </Button>
              <Button
                onClick={() => handleReview('request_changes')}
                disabled={reviewTask.isPending}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="mr-2 size-4" /> Request Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Name *</label>
              <Input value={editForm.task_name} onChange={(e) => setEditForm({ ...editForm, task_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Est. Time</label>
                <div className="flex items-center gap-1">
                  <Input type="number" min="0" max="999" placeholder="0" value={editForm.estH} onChange={(e) => setEditForm({ ...editForm, estH: e.target.value })} className="w-14" />
                  <span className="text-xs text-muted-foreground">h</span>
                  <Input type="number" min="0" max="59" step="5" placeholder="0" value={editForm.estM} onChange={(e) => setEditForm({ ...editForm, estM: e.target.value })} className="w-14" />
                  <span className="text-xs text-muted-foreground">m</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateTask.isPending}>
                {updateTask.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub-Tasks — only show for top-level tasks */}
      {!task.parent_task_id && (
        <SubTasksSection taskId={id} subTasks={task.sub_tasks || []} />
      )}

      {/* Checklist + Time Entries side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChecklistSection taskId={id} />
        <TimeEntriesSection taskId={id} />
      </div>

      {/* Comments */}
      <CommentsSection taskId={id} />
    </div>
  )
}

// --- Sub-Tasks Section ---

function SubTasksSection({ taskId, subTasks: initialSubTasks }: { taskId: string; subTasks: SubTaskData[] }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [newSteps, setNewSteps] = useState<string[]>([''])

  const { data: subTasksRes } = useSubTasks(taskId)
  const subTasks = (subTasksRes?.data as SubTaskData[]) || initialSubTasks
  const createSubTask = useCreateSubTask(taskId)

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleAddSubTask() {
    const trimmedName = newName.trim()
    if (!trimmedName) return

    const checklist = newSteps
      .map((s) => s.trim())
      .filter(Boolean)
      .map((title, i) => ({ title, sort_order: i }))

    try {
      await createSubTask.mutateAsync({
        task_name: trimmedName,
        priority: newPriority,
        due_date: newDueDate || undefined,
        checklist: checklist.length ? checklist : undefined,
      })
      toast.success('Sub-task created')
      setNewName('')
      setNewPriority('medium')
      setNewDueDate('')
      setNewSteps([''])
      setShowAddForm(false)
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
    } catch {
      toast.error('Failed to create sub-task')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="size-5" />
            Sub-Tasks
            {subTasks.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({subTasks.length})
              </span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-1 size-4" /> Add Sub-Task
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add Sub-Task Form */}
        {showAddForm && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <Input
                  placeholder="Sub-task name *"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{formatLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                placeholder="Due date"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Steps</p>
              {newSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`Step ${i + 1}`}
                    value={step}
                    onChange={(e) => {
                      const updated = [...newSteps]
                      updated[i] = e.target.value
                      setNewSteps(updated)
                    }}
                    className="flex-1"
                  />
                  {i === newSteps.length - 1 && (
                    <Button size="icon" variant="ghost" onClick={() => setNewSteps([...newSteps, ''])}>
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddSubTask} disabled={createSubTask.isPending}>
                {createSubTask.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        )}

        {/* Sub-tasks List */}
        {subTasks.length === 0 && !showAddForm ? (
          <p className="text-sm text-muted-foreground">No sub-tasks yet.</p>
        ) : (
          subTasks.map((st) => {
            const isExpanded = expanded[st.id]
            const steps = st.task_checklist_items || []
            const checkedSteps = steps.filter((s) => s.is_checked).length

            return (
              <div key={st.id} className="rounded-lg border">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleExpand(st.id)}
                >
                  {steps.length > 0 ? (
                    isExpanded ? (
                      <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    )
                  ) : (
                    <div className="size-4 shrink-0" />
                  )}
                  <span
                    className="font-medium text-sm flex-1 cursor-pointer hover:text-blue-600 hover:underline"
                    onClick={(e) => { e.stopPropagation(); router.push(`/task/${st.id}`) }}
                  >
                    {st.task_name}
                  </span>
                  <Badge variant="secondary" className={`text-xs ${statusColors[st.status] || ''}`}>
                    {formatLabel(st.status)}
                  </Badge>
                  <Badge variant="secondary" className={`text-xs ${priorityColors[st.priority] || ''}`}>
                    {formatLabel(st.priority)}
                  </Badge>
                  {steps.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {checkedSteps}/{steps.length}
                    </span>
                  )}
                </div>
                {isExpanded && steps.length > 0 && (
                  <div className="border-t px-4 py-2 space-y-1.5 bg-muted/20">
                    {steps.map((step) => (
                      <div key={step.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={step.is_checked} disabled />
                        <span className={step.is_checked ? 'line-through text-muted-foreground' : ''}>
                          {step.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

// --- Checklist Section ---

function ChecklistSection({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const [newItem, setNewItem] = useState('')

  const { data: checklistResponse, isLoading } = useQuery({
    queryKey: ['tasks', taskId, 'checklist'],
    queryFn: () => apiFetch(`/api/v1/tasks/${taskId}/checklist`),
  })

  const items = (checklistResponse?.data as ChecklistItem[]) || []
  const checkedCount = items.filter((i) => i.is_checked).length
  const totalEstMin = items.reduce((s, i) => s + (i.estimated_minutes || 0), 0)
  const totalActMin = items.reduce((s, i) => s + (i.actual_minutes || 0), 0)

  const toggleMutation = useMutation({
    mutationFn: (item: ChecklistItem) =>
      apiFetch(`/api/v1/tasks/${taskId}/checklist`, {
        method: 'PATCH',
        body: JSON.stringify({ id: item.id, is_checked: !item.is_checked }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] }),
  })

  const timeMutation = useMutation({
    mutationFn: (payload: { id: string; estimated_minutes?: number | null; actual_minutes?: number | null }) =>
      apiFetch(`/api/v1/tasks/${taskId}/checklist`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] }),
  })

  const addMutation = useMutation({
    mutationFn: (title: string) =>
      apiFetch(`/api/v1/tasks/${taskId}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] })
      setNewItem('')
      toast.success('Step added')
    },
    onError: () => toast.error('Failed to add step'),
  })

  function handleAdd() {
    const trimmed = newItem.trim()
    if (!trimmed) return
    addMutation.mutate(trimmed)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="size-5" />
          Steps
          {items.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {checkedCount}/{items.length} done
            </span>
          )}
          {totalActMin > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              <Clock className="inline size-3.5 mr-0.5" />
              {formatMinutes(totalActMin)}
              {totalEstMin > 0 && <span className="text-muted-foreground/60"> / {formatMinutes(totalEstMin)}</span>}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No steps yet.</p>
        ) : (
          items.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={() => toggleMutation.mutate(item)}
              onTimeUpdate={(field, value) => timeMutation.mutate({ id: item.id, [field]: value })}
            />
          ))
        )}

        <Separator className="!mt-3" />

        <div className="flex items-center gap-2 !mt-3">
          <Input
            placeholder="Add step..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
            <Plus className="mr-1 size-4" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ChecklistRow({ item, onToggle, onTimeUpdate }: {
  item: ChecklistItem
  onToggle: () => void
  onTimeUpdate: (field: 'estimated_minutes' | 'actual_minutes', value: number | null) => void
}) {
  const [editing, setEditing] = useState<'est' | 'actual' | null>(null)
  const [editVal, setEditVal] = useState('')

  function startEdit(field: 'est' | 'actual') {
    const val = field === 'est' ? item.estimated_minutes : item.actual_minutes
    setEditVal(val != null ? String(val) : '')
    setEditing(field)
  }

  function commitEdit() {
    if (!editing) return
    const field = editing === 'est' ? 'estimated_minutes' : 'actual_minutes'
    const numVal = editVal.trim() === '' ? null : parseInt(editVal)
    if (numVal !== null && (isNaN(numVal) || numVal < 0)) { setEditing(null); return }
    onTimeUpdate(field, numVal)
    setEditing(null)
  }

  return (
    <div className="flex items-center gap-3 py-1.5 group rounded-md hover:bg-muted/30 px-1 -mx-1">
      <Checkbox checked={item.is_checked} onCheckedChange={onToggle} />
      <span className={`flex-1 text-sm ${item.is_checked ? 'line-through text-muted-foreground' : ''}`}>
        {item.title}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Estimated time */}
        {editing === 'est' ? (
          <div className="flex items-center gap-0.5">
            <Input
              type="number" min="0" className="w-14 h-6 text-xs px-1"
              value={editVal} onChange={(e) => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null) }}
              autoFocus
            />
            <span className="text-[10px] text-muted-foreground">m</span>
          </div>
        ) : (
          <button
            onClick={() => startEdit('est')}
            className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
            title="Estimated time (minutes)"
          >
            Est: {item.estimated_minutes != null ? formatMinutes(item.estimated_minutes) : '—'}
          </button>
        )}

        {/* Actual time */}
        {editing === 'actual' ? (
          <div className="flex items-center gap-0.5">
            <Input
              type="number" min="0" className="w-14 h-6 text-xs px-1"
              value={editVal} onChange={(e) => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null) }}
              autoFocus
            />
            <span className="text-[10px] text-muted-foreground">m</span>
          </div>
        ) : (
          <button
            onClick={() => startEdit('actual')}
            className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
              item.actual_minutes != null
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
            title="Actual time (minutes)"
          >
            Act: {item.actual_minutes != null ? formatMinutes(item.actual_minutes) : '—'}
          </button>
        )}
      </div>
    </div>
  )
}

// --- Time Entries Section ---

function TimeEntriesSection({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const [date, setDate] = useState('')
  const [hours, setHours] = useState('')
  const [billable, setBillable] = useState(false)

  const { data: entriesResponse, isLoading } = useQuery({
    queryKey: ['tasks', taskId, 'time-entries'],
    queryFn: () => apiFetch(`/api/v1/tasks/${taskId}/time-entries`),
  })

  const entries = (entriesResponse?.data as TimeEntry[]) || []
  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0)

  const addMutation = useMutation({
    mutationFn: (data: { date: string; hours: number; billable: boolean }) =>
      apiFetch(`/api/v1/tasks/${taskId}/time-entries`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'time-entries'] })
      setDate('')
      setHours('')
      setBillable(false)
      toast.success('Time entry added')
    },
    onError: () => toast.error('Failed to add time entry'),
  })

  function handleAdd() {
    if (!date || !hours) return
    addMutation.mutate({ date, hours: parseFloat(hours), billable })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5" />
          Time Entries
          {entries.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {totalHours.toFixed(1)} hrs total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Employee</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Hours</th>
                  <th className="pb-2 font-medium">Billable</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="py-2">{entry.employees?.name || entry.employee_name || '-'}</td>
                    <td className="py-2">{format(new Date(entry.date), 'dd MMM yyyy')}</td>
                    <td className="py-2">{entry.hours}</td>
                    <td className="py-2">
                      {entry.billable ? (
                        <CheckCircle2 className="size-4 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Separator />

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-36"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Hours</label>
            <Input
              type="number"
              step="0.5"
              min="0"
              placeholder="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Checkbox
              checked={billable}
              onCheckedChange={(v) => setBillable(v === true)}
            />
            <label className="text-sm">Billable</label>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
            <Plus className="mr-1 size-4" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Review Checklist Section (inline for reviewer to add review steps) ---

function ReviewChecklistSection({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const [newItem, setNewItem] = useState('')

  const { data: checklistResponse } = useQuery({
    queryKey: ['tasks', taskId, 'checklist'],
    queryFn: () => apiFetch(`/api/v1/tasks/${taskId}/checklist`),
  })

  const items = (checklistResponse?.data as ChecklistItem[]) || []

  const toggleMutation = useMutation({
    mutationFn: (item: ChecklistItem) =>
      apiFetch(`/api/v1/tasks/${taskId}/checklist`, {
        method: 'PATCH',
        body: JSON.stringify({ id: item.id, is_checked: !item.is_checked }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] }),
  })

  const addMutation = useMutation({
    mutationFn: (title: string) =>
      apiFetch(`/api/v1/tasks/${taskId}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] })
      setNewItem('')
    },
  })

  return (
    <div className="rounded-lg border border-primary/20 bg-card p-3 space-y-2">
      <p className="text-sm font-medium">Checklist</p>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Checkbox
            checked={item.is_checked}
            onCheckedChange={() => toggleMutation.mutate(item)}
          />
          <span className={`text-sm ${item.is_checked ? 'line-through text-muted-foreground' : ''}`}>
            {item.title}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <Input
          placeholder="Add review step..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = newItem.trim(); if (t) addMutation.mutate(t) } }}
          className="flex-1 h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => { const t = newItem.trim(); if (t) addMutation.mutate(t) }}
          disabled={addMutation.isPending}
        >
          <Plus className="size-3 mr-1" /> Add
        </Button>
      </div>
    </div>
  )
}

// --- Comments Section ---

function CommentsSection({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')

  const { data: commentsResponse, isLoading } = useQuery({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: () => apiFetch(`/api/v1/tasks/${taskId}/comments`),
  })

  const comments = (commentsResponse?.data as Comment[]) || []

  const addMutation = useMutation({
    mutationFn: (comment: string) =>
      apiFetch(`/api/v1/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] })
      setCommentText('')
      toast.success('Comment posted')
    },
    onError: () => toast.error('Failed to post comment'),
  })

  function handlePost() {
    const trimmed = commentText.trim()
    if (!trimmed) return
    addMutation.mutate(trimmed)
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          comments.map((comment) => {
            const name = comment.employees?.name || comment.employee_name || 'Unknown'
            return (
              <div key={comment.id} className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'dd MMM yyyy, hh:mm a')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{comment.comment}</p>
                </div>
              </div>
            )
          })
        )}

        <Separator />

        <div className="space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handlePost} disabled={addMutation.isPending}>
              Post Comment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
