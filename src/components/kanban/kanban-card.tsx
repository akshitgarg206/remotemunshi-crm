'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

const priorityDots: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

interface KanbanCardProps {
  task: {
    id: string
    task_name: string
    status: string
    priority: string
    due_date: string | null
    clients?: { business_name: string } | null
    task_assignees?: { employee_id: string; employees: { id: string; name: string; avatar_url?: string | null } }[]
    reviewer_1_id?: string | null
    reviewer_2_id?: string | null
    current_review_level?: number
  }
}

export function KanbanCard({ task }: KanbanCardProps) {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
  const assignees = task.task_assignees || []
  const hasReview = !!(task.reviewer_1_id)
  const reviewLevel = task.current_review_level

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border bg-card text-card-foreground p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow space-y-2"
    >
      {/* Task name — clickable */}
      <p
        className="text-sm font-medium leading-tight cursor-pointer hover:text-primary hover:underline"
        onClick={(e) => { e.stopPropagation(); router.push(`/task/${task.id}`) }}
      >
        {task.task_name}
      </p>

      {/* Client */}
      {task.clients?.business_name && (
        <p className="text-xs text-muted-foreground truncate">{task.clients.business_name}</p>
      )}

      {/* Bottom row: priority dot, due date, review badge, avatars */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Priority dot */}
          <span className={`inline-block size-2.5 rounded-full ${priorityDots[task.priority] || 'bg-gray-400'}`}
            title={task.priority}
          />
          {/* Due date */}
          {task.due_date && (
            <span className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
              {new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          )}
          {/* Review badge */}
          {hasReview && reviewLevel && task.status === 'in_review' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
              L{reviewLevel}
            </Badge>
          )}
        </div>

        {/* Assignee avatars */}
        {assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 3).map((a) => (
              <div
                key={a.employee_id}
                className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary ring-2 ring-card"
                title={a.employees?.name}
              >
                {a.employees?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-medium ring-2 ring-card">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
