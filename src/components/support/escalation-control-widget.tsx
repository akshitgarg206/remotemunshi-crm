'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight } from 'lucide-react'
import { EscalationBadge } from './escalation-badge'
import { SlaTimer } from './sla-timer'

interface EscalationControlWidgetProps {
  escalation: {
    id: string
    tier: string
    status: string
    priority: string
    sla_due_at?: string
    to_employee?: { name: string } | null
    to_department?: { name: string } | null
  }
  onReEscalate?: () => void
}

export function EscalationControlWidget({ escalation, onReEscalate }: EscalationControlWidgetProps) {
  return (
    <Card className="bg-red-900/10 border-red-700/30">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm text-red-400 flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Escalation Control
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <EscalationBadge tier={escalation.tier} status={escalation.status} />

        <div className="space-y-2 text-sm">
          {escalation.to_employee && (
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned to</span>
              <span className="text-white">{escalation.to_employee.name}</span>
            </div>
          )}
          {escalation.to_department && (
            <div className="flex justify-between">
              <span className="text-slate-400">Department</span>
              <span className="text-white">{escalation.to_department.name}</span>
            </div>
          )}
          {escalation.sla_due_at && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">SLA</span>
              <SlaTimer dueAt={escalation.sla_due_at} />
            </div>
          )}
        </div>

        {onReEscalate && escalation.status !== 'resolved' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReEscalate}
            className="w-full border-red-700/40 text-red-400 hover:bg-red-900/20"
          >
            Re-escalate
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
