'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  DndContext, DragOverlay, closestCenter, PointerSensor,
  useSensor, useSensors, useDroppable,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { LeadKanbanCard, type LeadCardItem } from './lead-kanban-card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LeadStage {
  id: string
  name: string
  color: string
  sort_order: number
}

interface LeadKanbanBoardProps {
  leads: LeadCardItem[]
  stages: LeadStage[]
  onStageChange: (leadId: string, newStageId: string) => Promise<void>
}

function Column({ id, label, color, leads, activeLeadId, isOverColumn }: {
  id: string; label: string; color: string; leads: LeadCardItem[]
  activeLeadId: string | null; isOverColumn: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const highlighted = isOver || isOverColumn

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] rounded-lg border bg-muted/30 transition-shadow duration-150 ${highlighted ? 'ring-2 ring-primary/40 shadow-lg' : ''}`}
      style={{ borderTopWidth: '4px', borderTopColor: color }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
          {leads.length}
        </span>
      </div>
      <ScrollArea className="flex-1 p-2" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        <div className="space-y-2 min-h-[40px]">
          {leads.map((lead) => (
            <LeadKanbanCard key={lead.id} lead={lead} isDragSource={lead.id === activeLeadId} />
          ))}
          {leads.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No leads</p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Special column for leads with no stage
function UnstagedColumn({ leads, activeLeadId, isOverColumn }: {
  leads: LeadCardItem[]; activeLeadId: string | null; isOverColumn: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: '__unstaged__' })
  const highlighted = isOver || isOverColumn

  if (leads.length === 0) return null

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] rounded-lg border border-t-4 border-t-gray-400 bg-muted/30 transition-shadow duration-150 ${highlighted ? 'ring-2 ring-primary/40 shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <h3 className="text-sm font-semibold text-muted-foreground">Unstaged</h3>
        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
          {leads.length}
        </span>
      </div>
      <ScrollArea className="flex-1 p-2" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        <div className="space-y-2 min-h-[40px]">
          {leads.map((lead) => (
            <LeadKanbanCard key={lead.id} lead={lead} isDragSource={lead.id === activeLeadId} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export function LeadKanbanBoard({ leads, stages, onStageChange }: LeadKanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<LeadCardItem | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)
  const [optimisticMoves, setOptimisticMoves] = useState<Record<string, string>>({})

  useEffect(() => {
    if (Object.keys(optimisticMoves).length === 0) return
    const stale: string[] = []
    for (const [leadId, optimisticStageId] of Object.entries(optimisticMoves)) {
      const lead = leads.find(l => l.id === leadId)
      if (!lead || lead.stage_id === optimisticStageId) stale.push(leadId)
    }
    if (stale.length > 0) {
      setOptimisticMoves(prev => {
        const next = { ...prev }
        for (const id of stale) delete next[id]
        return Object.keys(next).length === Object.keys(prev).length ? prev : next
      })
    }
  }, [leads, optimisticMoves])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const effectiveLeads = useMemo(() => {
    if (Object.keys(optimisticMoves).length === 0) return leads
    return leads.map(l => optimisticMoves[l.id] ? { ...l, stage_id: optimisticMoves[l.id] } : l)
  }, [leads, optimisticMoves])

  const sortedStages = useMemo(() =>
    [...stages].sort((a, b) => a.sort_order - b.sort_order),
  [stages])

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, LeadCardItem[]> = {}
    for (const stage of sortedStages) grouped[stage.id] = []
    grouped['__unstaged__'] = []
    for (const lead of effectiveLeads) {
      const key = lead.stage_id && grouped[lead.stage_id] ? lead.stage_id : '__unstaged__'
      grouped[key].push(lead)
    }
    return grouped
  }, [effectiveLeads, sortedStages])

  const allColumnIds = useMemo(() => [...sortedStages.map(s => s.id), '__unstaged__'], [sortedStages])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const lead = effectiveLeads.find(l => l.id === event.active.id)
    if (lead) setActiveLead(lead)
  }, [effectiveLeads])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    if (!over) { setOverColumnId(null); return }
    if (allColumnIds.includes(over.id as string)) { setOverColumnId(over.id as string); return }
    const overLead = effectiveLeads.find(l => l.id === over.id)
    if (overLead) { setOverColumnId(overLead.stage_id || '__unstaged__'); return }
    setOverColumnId(null)
  }, [effectiveLeads, allColumnIds])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const draggedLead = activeLead
    const { over } = event
    if (!over || !draggedLead) { setActiveLead(null); setOverColumnId(null); return }

    let targetStageId: string | undefined
    if (allColumnIds.includes(over.id as string)) {
      targetStageId = over.id as string
    } else {
      const overLead = effectiveLeads.find(l => l.id === over.id)
      if (overLead) targetStageId = overLead.stage_id || '__unstaged__'
    }

    const currentStageId = draggedLead.stage_id || '__unstaged__'
    if (!targetStageId || targetStageId === currentStageId || targetStageId === '__unstaged__') {
      setActiveLead(null); setOverColumnId(null); return
    }

    const leadId = draggedLead.id
    setOptimisticMoves(prev => ({ ...prev, [leadId]: targetStageId! }))
    setActiveLead(null)
    setOverColumnId(null)

    try {
      await onStageChange(leadId, targetStageId)
      const stageName = sortedStages.find(s => s.id === targetStageId)?.name || 'new stage'
      toast.success(`Moved to ${stageName}`)
    } catch {
      toast.error('Failed to update lead stage')
      setOptimisticMoves(prev => { const next = { ...prev }; delete next[leadId]; return next })
    }
  }, [activeLead, effectiveLeads, allColumnIds, sortedStages, onStageChange])

  const handleDragCancel = useCallback(() => {
    setActiveLead(null); setOverColumnId(null)
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
        {sortedStages.map((stage) => (
          <Column
            key={stage.id}
            id={stage.id}
            label={stage.name}
            color={stage.color}
            leads={leadsByStage[stage.id] || []}
            activeLeadId={activeLead?.id ?? null}
            isOverColumn={overColumnId === stage.id}
          />
        ))}
        <UnstagedColumn
          leads={leadsByStage['__unstaged__'] || []}
          activeLeadId={activeLead?.id ?? null}
          isOverColumn={overColumnId === '__unstaged__'}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <div className="w-[264px] rotate-[2deg] scale-105 shadow-xl">
            <LeadKanbanCard lead={activeLead} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
