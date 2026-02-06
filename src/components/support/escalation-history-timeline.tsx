'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EscalationBadge } from './escalation-badge'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'

interface EscalationEvent {
  id: string
  tier: string
  status: string
  priority: string
  reason: string
  created_at: string
  resolved_at?: string
  from_employee_id?: string
  to_employee_id?: string
}

interface EscalationHistoryTimelineProps {
  escalations: EscalationEvent[]
}

export function EscalationHistoryTimeline({ escalations }: EscalationHistoryTimelineProps) {
  if (!escalations.length) return null

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Escalation History
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-4">
            {escalations.map((esc) => (
              <div key={esc.id} className="relative pl-6">
                {/* Dot */}
                <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full bg-muted border-2 border-border" />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <EscalationBadge tier={esc.tier} status={esc.status} />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(esc.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{esc.reason}</p>
                  {esc.resolved_at && (
                    <p className="text-xs text-green-400">
                      Resolved {format(new Date(esc.resolved_at), 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
