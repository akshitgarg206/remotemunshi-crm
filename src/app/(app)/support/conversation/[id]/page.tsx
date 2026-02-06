'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChatArea } from '@/components/support/chat-area'
import { CustomerContextPanel } from '@/components/support/customer-context-panel'
import { EscalationModal } from '@/components/support/escalation-modal'
import { EscalationControlWidget } from '@/components/support/escalation-control-widget'
import { EscalationHistoryTimeline } from '@/components/support/escalation-history-timeline'
import { QuickReplyPicker } from '@/components/support/quick-reply-picker'
import { AiReplyButton } from '@/components/support/ai-reply-button'
import { ConversationList } from '@/components/support/conversation-list'
import { useConversation } from '@/hooks/queries/use-support-conversations'
import { useOmnideskStore } from '@/stores/omnidesk-store'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function ConversationDetailPage() {
  const params = useParams()
  const conversationId = params.id as string
  const { setActiveConversationId } = useOmnideskStore()
  const composerRef = useRef<{ insertText: (text: string) => void } | null>(null)

  // Set active conversation
  setActiveConversationId(conversationId)

  const { data: convData } = useConversation(conversationId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversation = convData?.data as any
  const ticket = conversation?.support_tickets?.[0]
  const escalations = ticket?.support_escalations || []
  const latestEscalation = escalations[escalations.length - 1]

  const [escalationOpen, setEscalationOpen] = useState(false)

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left: Conversation List */}
      <div className="w-80 shrink-0">
        <ConversationList />
      </div>

      {/* Center: Chat */}
      <div className="flex-1 flex flex-col min-w-0 border-x">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-1.5 border-b bg-muted/50">
          <QuickReplyPicker onSelect={(text) => composerRef.current?.insertText(text)} />
          <AiReplyButton
            conversationId={conversationId}
            onGenerated={(text) => composerRef.current?.insertText(text)}
          />
        </div>
        <ChatArea
          conversationId={conversationId}
          onEscalate={ticket ? () => setEscalationOpen(true) : undefined}
          composerRef={composerRef}
        />
      </div>

      {/* Right: Context + Escalation */}
      <div className="w-80 shrink-0">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            <CustomerContextPanel conversationId={conversationId} />

            {/* Escalation widgets */}
            {latestEscalation && (
              <div className="px-4">
                <EscalationControlWidget
                  escalation={latestEscalation}
                  onReEscalate={() => setEscalationOpen(true)}
                />
              </div>
            )}

            {escalations.length > 0 && (
              <div className="px-4 pb-4">
                <EscalationHistoryTimeline escalations={escalations} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Escalation Modal */}
      {ticket && (
        <EscalationModal
          open={escalationOpen}
          onOpenChange={setEscalationOpen}
          ticketId={ticket.id}
          ticketNumber={ticket.ticket_number}
        />
      )}
    </div>
  )
}
