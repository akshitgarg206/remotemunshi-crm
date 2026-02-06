'use client'

import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'
import { format } from 'date-fns'

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    direction: string
    message_type: string
    is_internal: boolean
    sender?: { id: string; name: string } | null
    created_at: string
    attachments?: Array<{ name: string; url: string; type: string }> | null
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAgent = message.direction === 'outbound'
  const isSystem = message.message_type === 'system'
  const isInternal = message.is_internal
  const time = format(new Date(message.created_at), 'h:mm a')

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-muted-foreground italic bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  // Internal notes
  if (isInternal) {
    return (
      <div className="flex justify-end py-1">
        <div className="max-w-[70%] bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Lock className="h-3 w-3 text-amber-500" />
            <span className="text-xs text-amber-500 font-medium">Internal Note</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <div className="flex items-center justify-end gap-2 mt-1">
            {message.sender && (
              <span className="text-xs text-muted-foreground">{message.sender.name}</span>
            )}
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        </div>
      </div>
    )
  }

  // Regular messages
  return (
    <div className={cn('flex py-1', isAgent ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isAgent
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'block text-xs underline',
                  isAgent ? 'text-primary-foreground/80 hover:text-primary-foreground' : 'text-primary hover:text-primary/80'
                )}
              >
                {att.name}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-1">
          {isAgent && message.sender && (
            <span className={cn('text-xs', isAgent ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {message.sender.name}
            </span>
          )}
          <span className={cn('text-xs', isAgent ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {time}
          </span>
        </div>
      </div>
    </div>
  )
}
