'use client'

import { Button } from '@/components/ui/button'
import { FileText, SearchX, AlertCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type EmptyStateVariant = 'no-data' | 'no-results' | 'error'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  icon?: LucideIcon
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  className?: string
}

const defaults: Record<EmptyStateVariant, { icon: LucideIcon; title: string; description: string }> = {
  'no-data': {
    icon: FileText,
    title: 'No data yet',
    description: 'Get started by creating your first entry.',
  },
  'no-results': {
    icon: SearchX,
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
  'error': {
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'An error occurred while loading data. Please try again.',
  },
}

export function EmptyState({
  variant = 'no-data',
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: EmptyStateProps) {
  const d = defaults[variant]
  const Icon = icon || d.icon

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className={cn(
        'flex h-14 w-14 items-center justify-center rounded-2xl mb-4',
        variant === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      )}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title || d.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">{description || d.description}</p>
      <div className="flex items-center gap-3">
        {actionLabel && onAction && (
          <Button size="sm" onClick={onAction} variant={variant === 'error' ? 'destructive' : 'default'}>
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && onSecondary && (
          <Button variant="outline" size="sm" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
