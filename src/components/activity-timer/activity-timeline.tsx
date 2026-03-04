'use client'

import { useState } from 'react'
import { useActivityBlocks, useDeleteActivityBlock } from '@/hooks/queries/use-activity-blocks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { EditBlockDialog } from './edit-block-dialog'

/* eslint-disable @typescript-eslint/no-explicit-any */

const categoryColors: Record<string, string> = {
  operations: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  experiment: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  marketing: 'bg-green-500/10 text-green-700 dark:text-green-400',
  automation: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
}

const categoryLabels: Record<string, string> = {
  operations: 'Operations',
  experiment: 'Experiment',
  marketing: 'Marketing',
  automation: 'Automation',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function ActivityTimeline({ date, categoryFilter }: { date: string; categoryFilter?: string }) {
  const { data, isLoading } = useActivityBlocks({
    date,
    category: categoryFilter,
    pageSize: 100,
    sortBy: 'block_start',
    sortOrder: 'desc',
  })
  const deleteBlock = useDeleteActivityBlock()
  const blocks = (data?.data || []) as any[]

  const [editBlock, setEditBlock] = useState<any>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activity block?')) return
    try {
      await deleteBlock.mutateAsync(id)
      toast.success('Block deleted')
    } catch {
      toast.error('Failed to delete block')
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading timeline...</div>
  }

  if (blocks.length === 0) {
    return <div className="text-sm text-muted-foreground py-8 text-center">No activity blocks for this date</div>
  }

  return (
    <>
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

        {blocks.map((block: any) => (
          <div key={block.id} className="relative flex gap-4 py-2 group">
            {/* Dot */}
            <div className={cn(
              'relative z-10 mt-1.5 h-3 w-3 rounded-full border-2 shrink-0 ml-[7px]',
              block.is_missed
                ? 'border-amber-500 bg-amber-500/20'
                : 'border-primary bg-primary/20'
            )} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(block.block_start)} - {formatTime(block.block_end)}
                </span>
                <Badge variant="secondary" className={cn('text-[10px]', categoryColors[block.category])}>
                  {categoryLabels[block.category] || block.category}
                </Badge>
                {block.is_missed && (
                  <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                    Missed
                  </Badge>
                )}
              </div>
              {block.description && (
                <p className="text-sm mt-0.5 text-foreground">{block.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditBlock(block)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(block.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editBlock && (
        <EditBlockDialog block={editBlock} onClose={() => setEditBlock(null)} />
      )}
    </>
  )
}
