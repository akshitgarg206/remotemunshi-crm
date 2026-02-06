'use client'

import { useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowUpRight, MessageSquare } from 'lucide-react'
import { useConversation, useConversationMessages } from '@/hooks/queries/use-support-conversations'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { MessageBubble } from './message-bubble'
import { MessageComposer } from './message-composer'

const statusColors: Record<string, string> = {
  open: 'bg-green-600',
  waiting: 'bg-yellow-600',
  resolved: 'bg-blue-600',
  closed: 'bg-muted-foreground',
  spam: 'bg-red-600',
}

interface ChatAreaProps {
  conversationId: string
  onEscalate?: () => void
  composerRef?: React.MutableRefObject<{ insertText: (text: string) => void } | null>
}

export function ChatArea({ conversationId, onEscalate, composerRef }: ChatAreaProps) {
  const { data: convData, isLoading: convLoading } = useConversation(conversationId)
  const { data: msgData, isLoading: msgLoading } = useConversationMessages(conversationId)
  const scrollRef = useRef<HTMLDivElement>(null)
  useRealtimeMessages(conversationId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversation = convData?.data as any
  const messages = (msgData?.data || []) as any[]
  const ticket = conversation?.support_tickets?.[0]

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  if (convLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}>
              <Skeleton className="h-16 w-64 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-3" />
        <p className="text-sm">Select a conversation to start</p>
      </div>
    )
  }

  const contactName = conversation.contact?.name || conversation.client?.business_name || 'Unknown'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{contactName}</h2>
            {ticket && (
              <Badge variant="outline" className="text-xs">
                {ticket.ticket_number}
              </Badge>
            )}
            <Badge className={`text-xs text-white ${statusColors[conversation.status] || 'bg-muted-foreground'}`}>
              {conversation.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {conversation.subject || `via ${conversation.channel}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEscalate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEscalate}
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
              Escalate
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-1">
          {msgLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}>
                <Skeleton className="h-14 w-56 rounded-lg" />
              </div>
            ))
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg: Record<string, unknown>) => (
              <MessageBubble
                key={msg.id as string}
                message={msg as MessageBubbleProps['message']}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Composer */}
      <MessageComposer
        conversationId={conversationId}
        channel={conversation.channel}
        composerRef={composerRef}
      />
    </div>
  )
}

type MessageBubbleProps = React.ComponentProps<typeof MessageBubble>
