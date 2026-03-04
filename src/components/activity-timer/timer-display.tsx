'use client'

import { useTimerStore } from '@/stores/timer-store'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerDisplay() {
  const { isRunning, secondsRemaining, isTimerComplete, start, pause, reset, openEntryDialog } = useTimerStore()

  const progress = 1 - secondsRemaining / 900
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular progress */}
      <div className="relative w-56 h-56">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/20"
          />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className={cn(
              'transition-all duration-1000',
              isTimerComplete ? 'text-red-500' : 'text-primary'
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'text-5xl font-mono font-bold tabular-nums',
              isTimerComplete && 'text-red-500 animate-pulse'
            )}
          >
            {formatTime(secondsRemaining)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {isTimerComplete ? 'Time\'s up!' : isRunning ? 'Running' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={reset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full"
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
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  )
}
