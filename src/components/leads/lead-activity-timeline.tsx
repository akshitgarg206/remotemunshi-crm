'use client'

import { useLeadActivity } from '@/hooks/queries/use-lead-activity'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  PlusCircle,
  Pencil,
  UserCheck,
  Activity,
} from 'lucide-react'

interface ActivityEntry {
  id: string
  action: string
  description: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
  employees: { id: string; name: string } | null
}

const ACTION_CONFIG: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  lead_created: { icon: PlusCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  lead_updated: { icon: Pencil, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  lead_stage_changed: { icon: ArrowRight, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  lead_converted: { icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
}

export function LeadActivityTimeline({ leadId }: { leadId: string }) {
  const { data, isLoading } = useLeadActivity(leadId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const activities = (data?.data as ActivityEntry[]) || []

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No activity recorded yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((entry) => {
        const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.lead_updated
        const Icon = config.icon

        return (
          <Card key={entry.id}>
            <CardContent className="flex items-start gap-4 py-3">
              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{entry.description}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {entry.action.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {entry.employees?.name && <span>{entry.employees.name}</span>}
                  {entry.employees?.name && <span>&middot;</span>}
                  <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
