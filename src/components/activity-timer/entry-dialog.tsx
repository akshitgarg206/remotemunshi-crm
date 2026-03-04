'use client'

import { useState, useEffect } from 'react'
import { useTimerStore, MissedBlock } from '@/stores/timer-store'
import { useActivitySuggestions, useCreateBatchActivityBlocks } from '@/hooks/queries/use-activity-blocks'
import { ACTIVITY_CATEGORY, ActivityCategory } from '@/types/enums'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

const categoryColors: Record<string, string> = {
  operations: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  experiment: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
  marketing: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
  automation: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
}

const categoryLabels: Record<string, string> = {
  operations: 'Operations',
  experiment: 'Experiment',
  marketing: 'Marketing',
  automation: 'Automation',
}

interface BlockEntry {
  category: ActivityCategory
  description: string
}

function formatBlockTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export function EntryDialog() {
  const { isEntryDialogOpen, closeEntryDialog, missedBlocks, currentBlockStart, restartAfterSubmit } = useTimerStore()
  const createBatch = useCreateBatchActivityBlocks()
  const isMobile = useIsMobile()

  // Current block entry
  const [currentEntry, setCurrentEntry] = useState<BlockEntry>({ category: 'operations', description: '' })

  // Missed block entries
  const [missedEntries, setMissedEntries] = useState<BlockEntry[]>([])

  // Suggestions
  const { data: suggestionsData } = useActivitySuggestions(currentEntry.category)
  const suggestions = (suggestionsData?.data || []) as { description: string; usage_count: number }[]

  // Initialize missed entries when dialog opens
  useEffect(() => {
    if (isEntryDialogOpen && missedBlocks.length > 0) {
      setMissedEntries(missedBlocks.map(() => ({ category: 'operations' as ActivityCategory, description: '' })))
    }
  }, [isEntryDialogOpen, missedBlocks.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    const blocks: Record<string, unknown>[] = []

    // Add missed blocks
    missedBlocks.forEach((mb: MissedBlock, i: number) => {
      const entry = missedEntries[i]
      if (entry) {
        blocks.push({
          block_start: mb.blockStart,
          block_end: mb.blockEnd,
          category: entry.category,
          description: entry.description,
          is_missed: true,
        })
      }
    })

    // Add current block
    if (currentBlockStart) {
      const blockEnd = new Date().toISOString()
      blocks.push({
        block_start: currentBlockStart,
        block_end: blockEnd,
        category: currentEntry.category,
        description: currentEntry.description,
        is_missed: false,
      })
    }

    if (blocks.length === 0) {
      toast.error('No blocks to submit')
      return
    }

    try {
      await createBatch.mutateAsync({ blocks })
      toast.success(`${blocks.length} activity block${blocks.length > 1 ? 's' : ''} logged`)
      setCurrentEntry({ category: 'operations', description: '' })
      setMissedEntries([])
      restartAfterSubmit()
    } catch {
      toast.error('Failed to save activity blocks')
    }
  }

  const content = (
    <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
      {/* Missed blocks section */}
      {missedBlocks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>{missedBlocks.length} missed block{missedBlocks.length > 1 ? 's' : ''}</span>
          </div>
          {missedBlocks.map((mb, i) => (
            <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                {formatBlockTime(mb.blockStart)} - {formatBlockTime(mb.blockEnd)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITY_CATEGORY.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      const updated = [...missedEntries]
                      if (updated[i]) updated[i] = { ...updated[i], category: cat }
                      setMissedEntries(updated)
                    }}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium border transition-colors',
                      missedEntries[i]?.category === cat
                        ? categoryColors[cat]
                        : 'border-transparent text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="What did you do?"
                rows={1}
                className="text-sm resize-none"
                value={missedEntries[i]?.description || ''}
                onChange={(e) => {
                  const updated = [...missedEntries]
                  if (updated[i]) updated[i] = { ...updated[i], description: e.target.value }
                  setMissedEntries(updated)
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Current block */}
      <div className="space-y-3">
        {missedBlocks.length > 0 && (
          <p className="text-sm font-medium">Current Block</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_CATEGORY.map((cat) => (
            <button
              key={cat}
              onClick={() => setCurrentEntry({ ...currentEntry, category: cat })}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                currentEntry.category === cat
                  ? categoryColors[cat]
                  : 'border-transparent text-muted-foreground hover:bg-accent'
              )}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Suggestion chips */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <Badge
                key={s.description}
                variant="outline"
                className="cursor-pointer hover:bg-accent text-xs"
                onClick={() => setCurrentEntry({ ...currentEntry, description: s.description })}
              >
                {s.description}
              </Badge>
            ))}
          </div>
        )}

        <Textarea
          placeholder="What did you do in the last 15 minutes?"
          rows={2}
          className="text-sm resize-none"
          value={currentEntry.description}
          onChange={(e) => setCurrentEntry({ ...currentEntry, description: e.target.value })}
          autoFocus
        />
      </div>

      <Button onClick={handleSubmit} disabled={createBatch.isPending} className="w-full">
        {createBatch.isPending ? 'Saving...' : 'Log & Continue'}
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isEntryDialogOpen} onOpenChange={(open) => { if (!open) closeEntryDialog() }}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Log Activity</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isEntryDialogOpen} onOpenChange={(open) => { if (!open) closeEntryDialog() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
