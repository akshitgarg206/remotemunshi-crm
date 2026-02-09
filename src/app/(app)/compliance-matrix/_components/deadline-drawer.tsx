'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { CheckCircle2, Clock, Send, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMarkDataReceived, useSendReminder, useUpdateDeadline } from '@/hooks/queries/use-deadlines'
import { useQueryClient } from '@tanstack/react-query'

/* eslint-disable @typescript-eslint/no-explicit-any */

const statusColors: Record<string, string> = {
  data_pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  data_received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  filed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try { return format(new Date(dateStr), 'dd MMM yyyy') } catch { return '-' }
}

function formatStatus(status: string): string {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface DeadlineDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deadline: any | null
}

export function DeadlineDrawer({ open, onOpenChange, deadline }: DeadlineDrawerProps) {
  const qc = useQueryClient()
  const markReceived = useMarkDataReceived(deadline?.id || '')
  const sendReminder = useSendReminder(deadline?.id || '')
  const updateDeadline = useUpdateDeadline(deadline?.id || '')

  if (!deadline) return null

  const client = deadline.clients as any
  const service = deadline.services as any
  const task = deadline.tasks as any
  const isOverdue = deadline.due_date && new Date(deadline.due_date) < new Date() && deadline.status !== 'filed'

  const handleMarkReceived = () => {
    markReceived.mutate(undefined, {
      onSuccess: () => {
        toast.success('Data marked as received')
        qc.invalidateQueries({ queryKey: ['compliance-matrix'] })
        onOpenChange(false)
      },
      onError: () => toast.error('Failed to mark data received'),
    })
  }

  const handleSendReminder = () => {
    sendReminder.mutate({}, {
      onSuccess: () => {
        toast.success('Reminder sent')
        qc.invalidateQueries({ queryKey: ['compliance-matrix'] })
      },
      onError: () => toast.error('Failed to send reminder'),
    })
  }

  const handleStatusChange = (newStatus: string) => {
    updateDeadline.mutate({ status: newStatus }, {
      onSuccess: () => {
        toast.success(`Status updated to ${formatStatus(newStatus)}`)
        qc.invalidateQueries({ queryKey: ['compliance-matrix'] })
        onOpenChange(false)
      },
      onError: () => toast.error('Failed to update status'),
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{service?.name || 'Deadline'}</SheetTitle>
          <SheetDescription>{deadline.period_label}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-4 pt-0">
          {/* Client Info */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Client</p>
            <p className="font-semibold">{client?.business_name || '-'}</p>
            {client?.client_code && (
              <p className="text-xs text-muted-foreground">{client.client_code}</p>
            )}
          </div>

          <Separator />

          {/* Status & Due Date */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge className={statusColors[deadline.status] || 'bg-gray-100 text-gray-700'}>
                {formatStatus(deadline.status)}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Due Date</p>
              <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                {formatDate(deadline.due_date)}
              </p>
            </div>
          </div>

          {/* Data Received */}
          <div className="flex items-center gap-2">
            {deadline.data_received ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Clock className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm">
              {deadline.data_received ? `Data received ${formatDate(deadline.data_received_at)}` : 'Data not yet received'}
            </span>
          </div>

          {/* Linked Task */}
          {task && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Linked Task</p>
              <Link
                href={`/task/${task.id}`}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
                onClick={() => onOpenChange(false)}
              >
                {task.task_name}
                <ExternalLink className="h-3 w-3" />
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                Task status: {formatStatus(task.status)}
              </p>
            </div>
          )}

          {deadline.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{deadline.notes}</p>
            </div>
          )}

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Actions</p>

            {!deadline.data_received && deadline.status !== 'filed' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleMarkReceived}
                disabled={markReceived.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {markReceived.isPending ? 'Marking...' : 'Mark Data Received'}
              </Button>
            )}

            {!deadline.data_received && deadline.status !== 'filed' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleSendReminder}
                disabled={sendReminder.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {sendReminder.isPending ? 'Sending...' : 'Send Reminder'}
              </Button>
            )}

            {deadline.status !== 'filed' && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Update Status</p>
                <Select onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Change status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_pending">Data Pending</SelectItem>
                    <SelectItem value="data_received">Data Received</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="filed">Filed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
