import { create } from 'zustand'

const BLOCK_DURATION = 900 // 15 minutes in seconds
const LS_KEY = 'activity-timer-state'

/** Floor a date to the nearest 15-minute clock boundary (e.g. 10:07 → 10:00, 10:22 → 10:15) */
function getClockBlockStart(date: Date): Date {
  const d = new Date(date)
  d.setSeconds(0, 0)
  d.setMinutes(Math.floor(d.getMinutes() / 15) * 15)
  return d
}

/** Seconds remaining until the next 15-minute clock boundary */
function secondsUntilNextBoundary(now: Date): number {
  const blockStart = getClockBlockStart(now)
  const blockEnd = new Date(blockStart.getTime() + BLOCK_DURATION * 1000)
  return Math.max(1, Math.round((blockEnd.getTime() - now.getTime()) / 1000))
}

export interface MissedBlock {
  blockStart: string // ISO string
  blockEnd: string   // ISO string
}

interface TimerPersistedState {
  isRunning: boolean
  secondsRemaining: number
  currentBlockStart: string | null // ISO string
  lastTickTimestamp: number | null  // Date.now() value
}

interface TimerState extends TimerPersistedState {
  missedBlocks: MissedBlock[]
  isEntryDialogOpen: boolean
  isTimerComplete: boolean

  // Actions
  start: () => void
  pause: () => void
  reset: () => void
  tick: () => void
  openEntryDialog: () => void
  closeEntryDialog: () => void
  setMissedBlocks: (blocks: MissedBlock[]) => void
  clearMissedBlocks: () => void
  hydrate: () => void
  onTimerComplete: () => void
  restartAfterSubmit: () => void
}

function persistState(state: TimerPersistedState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    // localStorage not available
  }
}

function loadPersistedState(): TimerPersistedState | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TimerPersistedState
  } catch {
    return null
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  secondsRemaining: BLOCK_DURATION,
  currentBlockStart: null,
  lastTickTimestamp: null,
  missedBlocks: [],
  isEntryDialogOpen: false,
  isTimerComplete: false,

  start: () => {
    const state = get()
    const now = new Date()
    const updates: Partial<TimerState> = {
      isRunning: true,
      lastTickTimestamp: Date.now(),
    }
    if (!state.currentBlockStart) {
      updates.currentBlockStart = getClockBlockStart(now).toISOString()
      updates.secondsRemaining = secondsUntilNextBoundary(now)
    }
    set(updates)
    persistState({ ...get(), ...updates } as TimerPersistedState)
  },

  pause: () => {
    set({ isRunning: false })
    persistState({ ...get(), isRunning: false } as TimerPersistedState)
  },

  reset: () => {
    const resetState: TimerPersistedState = {
      isRunning: false,
      secondsRemaining: BLOCK_DURATION,
      currentBlockStart: null,
      lastTickTimestamp: null,
    }
    set({ ...resetState, isTimerComplete: false })
    persistState(resetState)
  },

  tick: () => {
    const state = get()
    if (!state.isRunning || state.isTimerComplete) return

    // Wall-clock-based countdown: compute remaining from actual clock time
    // This prevents drift from setInterval inaccuracies over 900 ticks
    let remaining: number
    if (state.currentBlockStart) {
      const blockEndMs = new Date(state.currentBlockStart).getTime() + BLOCK_DURATION * 1000
      remaining = Math.round((blockEndMs - Date.now()) / 1000)
    } else {
      remaining = state.secondsRemaining - 1
    }

    if (remaining <= 0) {
      // Timer complete
      set({
        secondsRemaining: 0,
        isTimerComplete: true,
        isRunning: false,
        lastTickTimestamp: Date.now(),
      })
      persistState({ ...get(), secondsRemaining: 0, isRunning: false, lastTickTimestamp: Date.now() } as TimerPersistedState)
      get().onTimerComplete()
    } else {
      set({
        secondsRemaining: remaining,
        lastTickTimestamp: Date.now(),
      })
      persistState({ ...get(), secondsRemaining: remaining, lastTickTimestamp: Date.now() } as TimerPersistedState)
    }
  },

  onTimerComplete: () => {
    set({ isEntryDialogOpen: true })
  },

  openEntryDialog: () => set({ isEntryDialogOpen: true }),
  closeEntryDialog: () => set({ isEntryDialogOpen: false }),

  setMissedBlocks: (blocks) => set({ missedBlocks: blocks }),
  clearMissedBlocks: () => set({ missedBlocks: [] }),

  restartAfterSubmit: () => {
    const now = new Date()
    const newState: TimerPersistedState = {
      isRunning: true,
      secondsRemaining: secondsUntilNextBoundary(now),
      currentBlockStart: getClockBlockStart(now).toISOString(),
      lastTickTimestamp: Date.now(),
    }
    set({
      ...newState,
      isEntryDialogOpen: false,
      isTimerComplete: false,
      missedBlocks: [],
    })
    persistState(newState)
  },

  hydrate: () => {
    const persisted = loadPersistedState()
    if (!persisted) return

    const now = Date.now()
    const { isRunning, secondsRemaining, currentBlockStart, lastTickTimestamp } = persisted

    if (!isRunning || !lastTickTimestamp) {
      // Timer was paused — just restore state
      set({
        isRunning: false,
        secondsRemaining,
        currentBlockStart,
        lastTickTimestamp,
      })
      return
    }

    // Timer was running — calculate elapsed time since last tick
    const elapsedMs = now - lastTickTimestamp
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    const adjustedRemaining = secondsRemaining - elapsedSeconds

    if (adjustedRemaining <= 0) {
      // Timer completed while away — detect missed blocks using clock-aligned boundaries
      const missedBlocks: MissedBlock[] = []

      if (currentBlockStart) {
        const startTime = new Date(currentBlockStart)
        const blockStartAligned = getClockBlockStart(startTime)
        const blockEndAligned = new Date(blockStartAligned.getTime() + BLOCK_DURATION * 1000)

        // The original running block
        missedBlocks.push({
          blockStart: blockStartAligned.toISOString(),
          blockEnd: blockEndAligned.toISOString(),
        })

        // Any additional full 15-min clock blocks that passed
        const nowMs = Date.now()
        let prevEnd = blockEndAligned.getTime()
        for (let i = 0; i < 20 && prevEnd + BLOCK_DURATION * 1000 <= nowMs; i++) {
          const nextEnd = prevEnd + BLOCK_DURATION * 1000
          missedBlocks.push({
            blockStart: new Date(prevEnd).toISOString(),
            blockEnd: new Date(nextEnd).toISOString(),
          })
          prevEnd = nextEnd
        }
      }

      set({
        isRunning: false,
        secondsRemaining: 0,
        isTimerComplete: true,
        currentBlockStart,
        lastTickTimestamp: now,
        missedBlocks,
        isEntryDialogOpen: missedBlocks.length > 0,
      })
      persistState({ isRunning: false, secondsRemaining: 0, currentBlockStart, lastTickTimestamp: now })
    } else {
      // Timer still running, just adjust remaining
      set({
        isRunning: true,
        secondsRemaining: adjustedRemaining,
        currentBlockStart,
        lastTickTimestamp: now,
      })
      persistState({ isRunning: true, secondsRemaining: adjustedRemaining, currentBlockStart, lastTickTimestamp: now })
    }
  },
}))
