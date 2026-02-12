'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, Paperclip, Lock, LockOpen } from 'lucide-react'
import { useSendMessage } from '@/hooks/queries/use-support-conversations'
import { useOmnideskStore } from '@/stores/omnidesk-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  in_person: 'In Person',
}

interface MessageComposerProps {
  conversationId: string
  channel?: string
  composerRef?: React.MutableRefObject<{ insertText: (text: string) => void } | null>
}

export function MessageComposer({ conversationId, channel, composerRef }: MessageComposerProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isInternalNote, setIsInternalNote, selectedChannel } = useOmnideskStore()
  const sendMessage = useSendMessage()

  const displayChannel = channel || selectedChannel || 'whatsapp'

  // Expose insertText for AI reply / quick replies
  useEffect(() => {
    if (composerRef) {
      composerRef.current = {
        insertText: (text: string) => {
          setContent(text)
          textareaRef.current?.focus()
        },
      }
    }
  }, [composerRef])

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px'
    }
  }, [content])

  const handleSend = () => {
    if (!content.trim()) return

    sendMessage.mutate(
      {
        conversationId,
        data: {
          content: content.trim(),
          direction: 'outbound',
          is_internal: isInternalNote,
          channel: displayChannel,
        },
      },
      {
        onSuccess: () => {
          setContent('')
          if (isInternalNote) setIsInternalNote(false)
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn(
      'border-t p-3 space-y-2',
      isInternalNote && 'border-amber-500/30 bg-amber-500/5'
    )}>
      {/* Channel indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Sending as</span>
        <Badge variant="outline" className="text-xs">
          {channelLabels[displayChannel] || displayChannel}
        </Badge>
      </div>

      {/* Textarea + Actions */}
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isInternalNote ? 'Write an internal note...' : 'Type your reply here...'}
          className={cn(
            'flex-1 min-h-[40px] max-h-[160px] resize-none',
            isInternalNote && 'bg-amber-500/5'
          )}
          rows={1}
        />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-9 w-9"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsInternalNote(!isInternalNote)}
            className={cn(
              'h-9 w-9',
              isInternalNote ? 'text-amber-500 hover:text-amber-400' : 'text-muted-foreground hover:text-foreground'
            )}
            title={isInternalNote ? 'Switch to customer reply' : 'Switch to internal note'}
          >
            {isInternalNote ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!content.trim() || sendMessage.isPending}
            className="h-9 px-4"
          >
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
