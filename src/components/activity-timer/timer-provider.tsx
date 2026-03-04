'use client'

import { useEffect, useRef } from 'react'
import { useTimerStore } from '@/stores/timer-store'
import { playTripleBeep } from '@/lib/audio/beep'
import { requestNotificationPermission, sendTimerNotification } from '@/lib/notifications/notify'
import { EntryDialog } from './entry-dialog'

export function TimerProvider() {
  const { isRunning, isTimerComplete, tick, hydrate } = useTimerStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevCompleteRef = useRef(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Tick interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tick()
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, tick])

  // Request notification permission when timer first starts
  useEffect(() => {
    if (isRunning) {
      requestNotificationPermission()
    }
  }, [isRunning])

  // Play beep + send notification when timer completes
  useEffect(() => {
    if (isTimerComplete && !prevCompleteRef.current) {
      playTripleBeep()
      sendTimerNotification()
    }
    prevCompleteRef.current = isTimerComplete
  }, [isTimerComplete])

  // Handle visibility change — recalculate elapsed time when tab comes back
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        hydrate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [hydrate])

  // Cross-tab sync via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'activity-timer-state') {
        hydrate()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [hydrate])

  return <EntryDialog />
}
