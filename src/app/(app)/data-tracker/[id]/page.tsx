'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'
import { useDeadline, useMarkDataReceived, useSendReminder, useUpdateDeadline } from '@/hooks/queries/use-deadlines'

/* eslint-disable @typescript-eslint/no-explicit-any */

const statusColors: Record<string, string> = {
  data_pending: 'bg-yellow-100 text-yellow-700',
  data_received: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  filed: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  upcoming: 'bg-gray-100 text-gray-700',
}

const reminderStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  skipped: 'bg-gray-100 text-gray-700',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return '-'
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, HH:mm')
  } catch {
    return '-'
  }
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || '-'}</dd>
    </div>
  )
}

export default function DeadlineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [notes, setNotes] = useState<string | null>(null)

  const { data: deadlineRes, isLoading } = useDeadline(id)
  const deadline = (deadlineRes as any)?.data as Record<string, any> | undefined

  const markReceived = useMarkDataReceived(id)
  const sendReminder = useSendReminder(id)
  const updateDeadline = useUpdateDeadline(id)

  const createTaskMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: async (res: any) => {
      const taskId = res?.data?.id
      if (taskId) {
        await updateDeadline.mutateAsync({ task_id: taskId })
        toast.success('Task created and linked')
      }
    },
    onError: () => toast.error('Failed to create task'),
  })

  // Loading state
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

  if (!deadline) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/data-tracker')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Data Tracker
        </Button>
        <div className="text-center py-12 text-muted-foreground">Deadline not found</div>
      </div>
    )
  }

  const service = deadline.services as Record<string, any> | null
  const client = deadline.clients as Record<string, any> | null
  const reminders = (deadline.deadline_reminders ?? []) as Record<string, any>[]
  const currentNotes = notes ?? (deadline.notes || '')

  const handleStatusChange = (newStatus: string) => {
    updateDeadline.mutate(
      { status: newStatus },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: () => toast.error('Failed to update status'),
      }
    )
  }

  const handleSaveNotes = () => {
    updateDeadline.mutate(
      { notes: currentNotes },
      {
        onSuccess: () => toast.success('Notes saved'),
        onError: () => toast.error('Failed to save notes'),
      }
    )
  }

  const handleMarkReceived = () => {
    markReceived.mutate(undefined, {
      onSuccess: () => toast.success('Marked as data received'),
      onError: () => toast.error('Failed to mark data received'),
    })
  }

  const handleSendReminder = (reminderId: string) => {
    sendReminder.mutate(
      {},
      {
        onSuccess: () => toast.success('Reminder sent'),
        onError: () => toast.error('Failed to send reminder'),
      }
    )
  }

  const handleCreateTask = () => {
    createTaskMutation.mutate({
      task_name: `${service?.name || 'Service'} - ${deadline.period_label}`,
      client_id: deadline.client_id,
      service_id: deadline.service_id,
      priority: 'medium',
      status: 'pending',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/data-tracker')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {service?.name || 'Deadline'} — {client?.business_name || 'Client'}
              </h1>
              <Badge variant="secondary" className={statusColors[deadline.status] || 'bg-gray-100 text-gray-700'}>
                {(deadline.status || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{deadline.period_label}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!deadline.data_received && (
            <Button onClick={handleMarkReceived} disabled={markReceived.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {markReceived.isPending ? 'Marking...' : 'Mark Data Received'}
            </Button>
          )}
          {!deadline.task_id && (
            <Button variant="outline" onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
              <ClipboardList className="mr-2 h-4 w-4" />
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          )}
        </div>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Deadline Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Due Date" value={formatDate(deadline.due_date)} />
            <DetailField
              label="Period"
              value={`${formatDate(deadline.period_start)} - ${formatDate(deadline.period_end)}`}
            />
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Select value={deadline.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="data_pending">Data Pending</SelectItem>
                    <SelectItem value="data_received">Data Received</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="filed">Filed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </dd>
            </div>
            <DetailField
              label="Data Received"
              value={deadline.data_received ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Yes
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" /> No
                </span>
              )}
            />
            <DetailField label="Data Received At" value={formatDateTime(deadline.data_received_at)} />
            <DetailField label="Data Received By" value={deadline.data_received_by || '-'} />
          </dl>
          <div className="mt-6 space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={currentNotes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this deadline..."
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveNotes}
                disabled={updateDeadline.isPending}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Task Card */}
      {deadline.task_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Linked Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium">{deadline.tasks?.task_name || `Task #${deadline.task_id}`}</span>
                {deadline.tasks?.status && (
                  <Badge variant="secondary" className="capitalize">
                    {(deadline.tasks.status as string).replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/task/${deadline.task_id}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminder Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Reminder Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reminders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.reminder_date)}</TableCell>
                    <TableCell className="capitalize">{r.channel || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={reminderStatusColors[r.status] || 'bg-gray-100 text-gray-700'}
                      >
                        {(r.status || '').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(r.sent_at)}</TableCell>
                    <TableCell>
                      {r.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(r.id)}
                          disabled={sendReminder.isPending}
                        >
                          <Send className="mr-1 h-3 w-3" />
                          Send Now
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No reminders scheduled</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
