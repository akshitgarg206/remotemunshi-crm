import { cn } from '@/lib/utils'
import { getStatusColor, formatStatusLabel } from '@/lib/status-colors'

interface StatusBadgeProps {
  status: string
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const colors = getStatusColor(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        colors.bg,
        colors.text,
        className
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />}
      {formatStatusLabel(status)}
    </span>
  )
}
