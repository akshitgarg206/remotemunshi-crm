'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { toast } from 'sonner'
import { KanbanCard } from './kanban-card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TaskItem {
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
  review_1_status?: string | null
  review_2_status?: string | null
}

interface KanbanBoardProps {
  tasks: TaskItem[]
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>
}

const COLUMNS = [
  { id: 'pending', label: 'Pending', color: 'border-t-yellow-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-t-blue-400' },
  { id: 'in_review', label: 'In Review', color: 'border-t-purple-400' },
  { id: 'request_changes', label: 'Changes Requested', color: 'border-t-orange-400' },
  { id: 'completed', label: 'Completed', color: 'border-t-green-400' },
]

function Column({ id, label, color, tasks }: { id: string; label: string; color: string; tasks: TaskItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] rounded-lg border border-t-4 ${color} bg-muted/30 ${isOver ? 'ring-2 ring-primary/30' : ''}`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
          {tasks.length}
        </span>
      </div>
      <ScrollArea className="flex-1 p-2" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">No tasks</p>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, TaskItem[]> = {}
    for (const col of COLUMNS) {
      grouped[col.id] = []
    }
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    }
    return grouped
  }, [tasks])

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as TaskItem | undefined
    if (task) setActiveTask(task)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Determine target column — the droppable id is the column status
    let targetStatus = over.id as string
    // If dropped on another card, use that card's column
    if (!COLUMNS.find(c => c.id === targetStatus)) {
      const overTask = tasks.find(t => t.id === over.id)
      if (overTask) targetStatus = overTask.status
    }

    if (targetStatus === task.status) return

    // Review guard: block drag to "Completed" if reviews not done
    if (targetStatus === 'completed' && task.reviewer_1_id) {
      const r1Done = task.review_1_status === 'approved'
      const r2Done = !task.reviewer_2_id || task.review_2_status === 'approved'
      if (!r1Done || !r2Done) {
        toast.error('Cannot complete — reviews not approved yet')
        return
      }
    }

    try {
      await onStatusChange(taskId, targetStatus)
      toast.success(`Moved to ${COLUMNS.find(c => c.id === targetStatus)?.label}`)
    } catch {
      toast.error('Failed to update task status')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            tasks={tasksByStatus[col.id] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[264px]">
            <KanbanCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
