'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface SlaTimerProps {
  dueAt: string
  className?: string
}

export function SlaTimer({ dueAt, className }: SlaTimerProps) {
  const [remaining, setRemaining] = useState('')
  const [status, setStatus] = useState<'ok' | 'warning' | 'danger' | 'overdue'>('ok')

  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const due = new Date(dueAt).getTime()
      const diff = due - now

      if (diff <= 0) {
        const overMs = Math.abs(diff)
        const overH = Math.floor(overMs / 3600000)
        const overM = Math.floor((overMs % 3600000) / 60000)
        setRemaining(`OVERDUE ${overH}h ${overM}m`)
        setStatus('overdue')
        return
      }

      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      if (hours > 2) {
        setRemaining(`${hours}h ${minutes}m`)
        setStatus('ok')
      } else if (hours >= 1) {
        setRemaining(`${hours}h ${minutes}m`)
        setStatus('warning')
      } else {
        setRemaining(`${minutes}m ${seconds}s`)
        setStatus('danger')
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [dueAt])

  const colorClass = {
    ok: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
    overdue: 'text-red-500 font-semibold animate-pulse',
  }[status]

  return (
    <span className={cn('flex items-center gap-1 text-xs font-mono', colorClass, className)}>
      <Clock className="h-3 w-3" />
      {remaining}
    </span>
  )
}
