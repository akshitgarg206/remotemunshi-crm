'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
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
  task_checklist_items?: { id: string; is_checked: boolean }[]
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

function Column({ id, label, color, tasks, activeTaskId, isOverColumn }: {
  id: string; label: string; color: string; tasks: TaskItem[]
  activeTaskId: string | null; isOverColumn: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const highlighted = isOver || isOverColumn

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] rounded-lg border border-t-4 ${color} bg-muted/30 transition-shadow duration-150 ${highlighted ? 'ring-2 ring-primary/40 shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
          {tasks.length}
        </span>
      </div>
      <ScrollArea className="flex-1 p-2" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        <div className="space-y-2 min-h-[40px]">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} isDragSource={task.id === activeTaskId} />
          ))}
          {tasks.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No tasks</p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)
  // Optimistic status overrides: taskId → newStatus (applied instantly, cleared when props update)
  const [optimisticMoves, setOptimisticMoves] = useState<Record<string, string>>({})
  const pendingMoves = useRef<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Merge optimistic overrides into task list
  const effectiveTasks = useMemo(() => {
    if (Object.keys(optimisticMoves).length === 0) return tasks
    return tasks.map(t => optimisticMoves[t.id] ? { ...t, status: optimisticMoves[t.id] } : t)
  }, [tasks, optimisticMoves])

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, TaskItem[]> = {}
    for (const col of COLUMNS) grouped[col.id] = []
    for (const task of effectiveTasks) {
      if (grouped[task.status]) grouped[task.status].push(task)
    }
    return grouped
  }, [effectiveTasks])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = effectiveTasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }, [effectiveTasks])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    if (!over) { setOverColumnId(null); return }

    const colId = COLUMNS.find(c => c.id === over.id)?.id
    if (colId) { setOverColumnId(colId); return }

    const overTask = effectiveTasks.find(t => t.id === over.id)
    if (overTask) { setOverColumnId(overTask.status); return }

    setOverColumnId(null)
  }, [effectiveTasks])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const draggedTask = activeTask
    setActiveTask(null)
    setOverColumnId(null)

    const { over } = event
    if (!over || !draggedTask) return

    // Resolve target column
    let targetStatus: string | undefined
    const directCol = COLUMNS.find(c => c.id === over.id)
    if (directCol) {
      targetStatus = directCol.id
    } else {
      const overTask = effectiveTasks.find(t => t.id === over.id)
      if (overTask) targetStatus = overTask.status
    }

    if (!targetStatus || targetStatus === draggedTask.status) return

    // Review guard
    if (targetStatus === 'completed' && draggedTask.reviewer_1_id) {
      const r1Done = draggedTask.review_1_status === 'approved'
      const r2Done = !draggedTask.reviewer_2_id || draggedTask.review_2_status === 'approved'
      if (!r1Done || !r2Done) {
        toast.error('Cannot complete — reviews not approved yet')
        return
      }
    }

    // Optimistic: move card instantly
    const taskId = draggedTask.id
    setOptimisticMoves(prev => ({ ...prev, [taskId]: targetStatus! }))
    pendingMoves.current.add(taskId)

    try {
      await onStatusChange(taskId, targetStatus)
      toast.success(`Moved to ${COLUMNS.find(c => c.id === targetStatus)?.label}`)
    } catch {
      toast.error('Failed to update task status')
      // Revert optimistic move
      setOptimisticMoves(prev => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
    } finally {
      pendingMoves.current.delete(taskId)
      // Clean up optimistic entry — props should now reflect the real status
      setOptimisticMoves(prev => {
        if (pendingMoves.current.has(taskId)) return prev
        const next = { ...prev }
        delete next[taskId]
        return next
      })
    }
  }, [activeTask, effectiveTasks, onStatusChange])

  const handleDragCancel = useCallback(() => {
    setActiveTask(null)
    setOverColumnId(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            tasks={tasksByStatus[col.id] || []}
            activeTaskId={activeTask?.id ?? null}
            isOverColumn={overColumnId === col.id}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-[264px] rotate-[2deg] scale-105 shadow-xl">
            <KanbanCard task={activeTask} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
