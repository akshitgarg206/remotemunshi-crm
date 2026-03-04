import { create } from 'zustand'

const BLOCK_DURATION = 900 // 15 minutes in seconds
const LS_KEY = 'activity-timer-state'

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
    const now = new Date().toISOString()
    const updates: Partial<TimerState> = {
      isRunning: true,
      lastTickTimestamp: Date.now(),
    }
    if (!state.currentBlockStart) {
      updates.currentBlockStart = now
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

    const newSeconds = state.secondsRemaining - 1
    if (newSeconds <= 0) {
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
        secondsRemaining: newSeconds,
        lastTickTimestamp: Date.now(),
      })
      persistState({ ...get(), secondsRemaining: newSeconds, lastTickTimestamp: Date.now() } as TimerPersistedState)
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
    const now = new Date().toISOString()
    const newState: TimerPersistedState = {
      isRunning: true,
      secondsRemaining: BLOCK_DURATION,
      currentBlockStart: now,
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
      // Timer completed while away — detect missed blocks
      const missedBlocks: MissedBlock[] = []

      if (currentBlockStart) {
        // The block that was running completed
        const blockEnd = new Date(new Date(currentBlockStart).getTime() + BLOCK_DURATION * 1000).toISOString()
        const totalElapsed = elapsedSeconds - secondsRemaining // seconds after the first block ended
        const additionalBlocks = Math.floor(totalElapsed / BLOCK_DURATION)

        // The original running block
        missedBlocks.push({
          blockStart: currentBlockStart,
          blockEnd,
        })

        // Any additional full 15-min blocks that passed
        let prevEnd = new Date(blockEnd).getTime()
        for (let i = 0; i < additionalBlocks && i < 20; i++) { // cap at 20 missed blocks (5 hours)
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
