'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useEscalations } from '@/hooks/queries/use-support-escalations'
import { SlaTimer } from './sla-timer'
import { cn } from '@/lib/utils'

const priorityBand: Record<string, string> = {
  low: 'border-l-green-500',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
}

const channelIcons: Record<string, string> = {
  whatsapp: 'WA',
  email: 'EM',
  phone: 'PH',
  sms: 'SM',
}

interface SupervisorQueueProps {
  selectedId: string | null
  onSelect: (escalationId: string, conversationId: string) => void
}

export function SupervisorQueue({ selectedId, onSelect }: SupervisorQueueProps) {
  const { data, isLoading } = useEscalations({
    status: 'pending',
    sortBy: 'created_at',
    sortOrder: 'asc',
    pageSize: 50,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const escalations = (data?.data || []) as any[]

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {escalations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No pending escalations</p>
        ) : (
          escalations.map((esc) => {
            const ticket = esc.ticket as Record<string, unknown> | null
            const conversation = ticket?.conversation as Record<string, unknown> | null
            const client = ticket?.client as Record<string, unknown> | null
            const fromEmp = esc.from_employee as Record<string, unknown> | null
            const channel = conversation?.channel as string

            return (
              <button
                key={esc.id as string}
                onClick={() => onSelect(esc.id as string, conversation?.id as string)}
                className={cn(
                  'w-full text-left rounded-lg border-l-4 p-3 transition-colors',
                  priorityBand[(esc.priority as string) || 'medium'],
                  selectedId === esc.id
                    ? 'bg-accent'
                    : 'bg-muted hover:bg-accent'
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {channel && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {channelIcons[channel] || channel}
                      </Badge>
                    )}
                    <span className="text-sm font-medium truncate">
                      {client?.business_name as string || 'Unknown'}
                    </span>
                  </div>
                  <Badge className={cn(
                    'text-[10px]',
                    esc.priority === 'urgent' ? 'bg-red-600' :
                    esc.priority === 'high' ? 'bg-orange-600' :
                    esc.priority === 'medium' ? 'bg-blue-600' : 'bg-green-600'
                  )}>
                    {(esc.priority as string)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{ticket?.subject as string}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">by {fromEmp?.name as string}</span>
                  {esc.sla_due_at && <SlaTimer dueAt={esc.sla_due_at as string} />}
                </div>
              </button>
            )
          })
        )}
      </div>
    </ScrollArea>
  )
}
