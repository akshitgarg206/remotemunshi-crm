'use client'

import { useDraggable } from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const temperatureDots: Record<string, string> = {
  hot: 'bg-red-500',
  warm: 'bg-orange-400',
  cold: 'bg-blue-400',
}

export interface LeadCardItem {
  id: string
  business_name: string
  contact_person: string | null
  deal_value: number | null
  temperature: string | null
  next_follow_up: string | null
  stage_id: string | null
  lead_assignees?: { employee_id: string; employees: { id: string; name: string } }[]
}

interface LeadKanbanCardProps {
  lead: LeadCardItem
  isDragSource?: boolean
  isOverlay?: boolean
}

export function LeadKanbanCard({ lead, isDragSource, isOverlay }: LeadKanbanCardProps) {
  const router = useRouter()
  const {
    attributes, listeners, setNodeRef, isDragging,
  } = useDraggable({ id: lead.id })

  const assignees = lead.lead_assignees || []
  const isOverdue = lead.next_follow_up && new Date(lead.next_follow_up) < new Date()

  if (isDragSource && !isOverlay) {
    return <div ref={setNodeRef} className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 h-[80px]" />
  }

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={`rounded-lg border bg-card text-card-foreground p-3 shadow-sm space-y-2 touch-none ${
        isOverlay ? 'cursor-grabbing' : isDragging ? 'opacity-50' : 'cursor-grab active:cursor-grabbing hover:shadow-md'
      } transition-shadow`}
    >
      {/* Temperature dot */}
      {lead.temperature && (
        <div className={`h-0.5 w-8 rounded-full ${temperatureDots[lead.temperature] || 'bg-gray-400'}`} />
      )}

      {/* Business name — clickable */}
      <p
        className="text-sm font-medium leading-tight cursor-pointer hover:text-primary transition-colors"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => router.push(`/leads/${lead.id}`)}
      >
        {lead.business_name}
      </p>

      {/* Contact person */}
      {lead.contact_person && (
        <p className="text-xs text-muted-foreground truncate">{lead.contact_person}</p>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {lead.temperature && (
            <span className={`inline-block size-2 rounded-full ${temperatureDots[lead.temperature] || 'bg-gray-400'}`}
              title={lead.temperature}
            />
          )}
          {lead.deal_value != null && lead.deal_value > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              {Number(lead.deal_value) >= 100000
                ? `${(Number(lead.deal_value) / 100000).toFixed(1)}L`
                : Number(lead.deal_value).toLocaleString('en-IN')}
            </span>
          )}
          {lead.next_follow_up && (
            <span className={`text-[11px] flex items-center gap-0.5 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3" />
              {format(new Date(lead.next_follow_up), 'dd MMM')}
            </span>
          )}
        </div>

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
