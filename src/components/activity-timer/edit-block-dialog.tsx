'use client'

import { useState } from 'react'
import { useUpdateActivityBlock } from '@/hooks/queries/use-activity-blocks'
import { ACTIVITY_CATEGORY, ActivityCategory } from '@/types/enums'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* eslint-disable @typescript-eslint/no-explicit-any */

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

export function EditBlockDialog({ block, onClose }: { block: any; onClose: () => void }) {
  const [category, setCategory] = useState<ActivityCategory>(block.category)
  const [description, setDescription] = useState(block.description || '')
  const updateBlock = useUpdateActivityBlock(block.id)

  const handleSave = async () => {
    try {
      await updateBlock.mutateAsync({ category, description })
      toast.success('Block updated')
      onClose()
    } catch {
      toast.error('Failed to update block')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Activity Block</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_CATEGORY.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  category === cat
                    ? categoryColors[cat]
                    : 'border-transparent text-muted-foreground hover:bg-accent'
                )}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What did you do?"
            className="resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateBlock.isPending}>
              {updateBlock.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
