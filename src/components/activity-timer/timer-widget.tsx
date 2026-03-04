'use client'

import { useTimerStore } from '@/stores/timer-store'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerWidget() {
  const { isRunning, secondsRemaining, isTimerComplete, missedBlocks, start, pause, openEntryDialog } = useTimerStore()

  const hasMissed = missedBlocks.length > 0

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => {
          if (isTimerComplete || hasMissed) {
            openEntryDialog()
          }
        }}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono font-medium transition-colors',
          isTimerComplete
            ? 'bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse cursor-pointer'
            : 'text-muted-foreground'
        )}
      >
        {hasMissed && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
        <span className="hidden sm:inline">{formatTime(secondsRemaining)}</span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => {
          if (isTimerComplete) {
            openEntryDialog()
          } else if (isRunning) {
            pause()
          } else {
            start()
          }
        }}
      >
        {isRunning ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}
