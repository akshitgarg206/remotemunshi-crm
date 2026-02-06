'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const tierLabels: Record<string, string> = {
  tier_1: 'Tier 1',
  tier_2: 'Tier 2',
  tier_3: 'Tier 3',
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40',
  acknowledged: 'bg-blue-600/20 text-blue-400 border-blue-600/40',
  in_progress: 'bg-purple-600/20 text-purple-400 border-purple-600/40',
  resolved: 'bg-green-600/20 text-green-400 border-green-600/40',
  declined: 'bg-red-600/20 text-red-400 border-red-600/40',
}

interface EscalationBadgeProps {
  tier: string
  status: string
  className?: string
}

export function EscalationBadge({ tier, status, className }: EscalationBadgeProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Badge variant="outline" className="text-xs border-orange-600/40 text-orange-400">
        {tierLabels[tier] || tier}
      </Badge>
      <Badge variant="outline" className={cn('text-xs', statusStyles[status] || '')}>
        {status.replace('_', ' ')}
      </Badge>
    </div>
  )
}
