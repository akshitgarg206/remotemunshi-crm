'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { MessageSquarePlus, MessagesSquare, Ticket, ArrowUpRight, Clock } from 'lucide-react'
import { ConversationList } from '@/components/support/conversation-list'
import { ChatArea } from '@/components/support/chat-area'
import { CustomerContextPanel } from '@/components/support/customer-context-panel'
import { QuickReplyPicker } from '@/components/support/quick-reply-picker'
import { AiReplyButton } from '@/components/support/ai-reply-button'
import { EscalationModal } from '@/components/support/escalation-modal'
import { useOmnideskStore } from '@/stores/omnidesk-store'
import { useTicketKpi } from '@/hooks/queries/use-support-tickets'
import { useCreateConversation } from '@/hooks/queries/use-support-conversations'
import { useConversation } from '@/hooks/queries/use-support-conversations'
import { toast } from 'sonner'

export default function SupportPage() {
  const { activeConversationId, setActiveConversationId } = useOmnideskStore()
  const { data: kpiData } = useTicketKpi()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kpis = (kpiData?.data || {}) as any
  const composerRef = useRef<{ insertText: (text: string) => void } | null>(null)

  // Escalation modal state
  const [escalationOpen, setEscalationOpen] = useState(false)
  const { data: convData } = useConversation(activeConversationId || '')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convAny = convData?.data as any
  const ticket = convAny?.support_tickets?.[0]

  // New conversation dialog
  const [newConvOpen, setNewConvOpen] = useState(false)
  const [newConvChannel, setNewConvChannel] = useState('whatsapp')
  const [newConvSubject, setNewConvSubject] = useState('')
  const createConversation = useCreateConversation()

  const handleNewConversation = () => {
    createConversation.mutate(
      { channel: newConvChannel, subject: newConvSubject || undefined },
      {
        onSuccess: (data) => {
          const id = (data as { data?: { id?: string } })?.data?.id
          if (id) setActiveConversationId(id)
          setNewConvOpen(false)
          setNewConvSubject('')
          toast.success('Conversation created')
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-b">
        <KpiCard
          title="Open Conversations"
          value={kpis.open_conversations ?? 0}
          icon={MessagesSquare}
        />
        <KpiCard
          title="Pending Tickets"
          value={kpis.pending_tickets ?? 0}
          icon={Ticket}
        />
        <KpiCard
          title="Unresolved Escalations"
          value={kpis.unresolved_escalations ?? 0}
          icon={ArrowUpRight}
        />
        <KpiCard
          title="Avg Response Time"
          value={kpis.avg_first_response_minutes ? `${Math.round(kpis.avg_first_response_minutes)}m` : 'N/A'}
          icon={Clock}
        />
      </div>

      {/* 3-Column Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Conversation List */}
        <div className="w-80 shrink-0 flex flex-col">
          <div className="p-2 border-b">
            <Button
              onClick={() => setNewConvOpen(true)}
              className="w-full"
              size="sm"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>
          <ConversationList />
        </div>

        {/* Center: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 border-x">
          {activeConversationId ? (
            <>
              {/* Toolbar with Quick Reply + AI */}
              <div className="flex items-center gap-2 px-4 py-1.5 border-b bg-muted/50">
                <QuickReplyPicker onSelect={(text) => composerRef.current?.insertText(text)} />
                <AiReplyButton
                  conversationId={activeConversationId}
                  onGenerated={(text) => composerRef.current?.insertText(text)}
                />
              </div>
              <ChatArea
                conversationId={activeConversationId}
                onEscalate={ticket ? () => setEscalationOpen(true) : undefined}
                composerRef={composerRef}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessagesSquare className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">OmniDesk</p>
              <p className="text-sm mt-1">Select a conversation or start a new one</p>
            </div>
          )}
        </div>

        {/* Right: Customer Context */}
        <div className="w-80 shrink-0">
          {activeConversationId ? (
            <CustomerContextPanel conversationId={activeConversationId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No conversation selected
            </div>
          )}
        </div>
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

      {/* New Conversation Dialog */}
      <Dialog open={newConvOpen} onOpenChange={setNewConvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={newConvChannel} onValueChange={setNewConvChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input
                value={newConvSubject}
                onChange={(e) => setNewConvSubject(e.target.value)}
                placeholder="Enter conversation subject..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewConvOpen(false)}>Cancel</Button>
            <Button onClick={handleNewConversation}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
