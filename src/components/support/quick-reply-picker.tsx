'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Zap, Search } from 'lucide-react'
import { useQuickReplies } from '@/hooks/queries/use-support-quick-replies'

interface QuickReplyPickerProps {
  onSelect: (content: string) => void
}

export function QuickReplyPicker({ onSelect }: QuickReplyPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data } = useQuickReplies({ pageSize: 100 })
  const replies = (data?.data || []) as Array<{
    id: string
    title: string
    content: string
    category?: string
    shortcut?: string
  }>

  const filtered = replies.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase()) ||
      (r.shortcut && r.shortcut.toLowerCase().includes(search.toLowerCase()))
  )

  // Group by category
  const grouped: Record<string, typeof filtered> = {}
  for (const r of filtered) {
    const cat = r.category || 'General'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(r)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9" title="Quick replies">
          <Zap className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quick replies..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="max-h-64">
          <div className="p-1">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs text-muted-foreground font-medium px-2 py-1">{category}</p>
                {items.map((reply) => (
                  <button
                    key={reply.id}
                    onClick={() => {
                      onSelect(reply.content)
                      setOpen(false)
                      setSearch('')
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{reply.title}</span>
                      {reply.shortcut && (
                        <span className="text-xs text-muted-foreground font-mono">/{reply.shortcut}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{reply.content}</p>
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No quick replies found</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
