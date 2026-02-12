'use client'

import { useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { MessageSquarePlus, MessagesSquare, Ticket, ArrowUpRight, Clock, AlertTriangle, Search, Mail, Phone, MessageCircle } from 'lucide-react'
import { WhatsAppSvgIcon, WhatsAppNumberIcon } from '@/components/icons/whatsapp-icon'
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
import { useWhatsAppAccounts, type WhatsAppAccount } from '@/hooks/queries/use-whatsapp-accounts'
import { useContacts } from '@/hooks/queries/use-contacts'
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
  const [newConvPhoneNumberId, setNewConvPhoneNumberId] = useState('')
  const [newConvContactId, setNewConvContactId] = useState('')
  const [newConvPhone, setNewConvPhone] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const createConversation = useCreateConversation()

  // WhatsApp accounts for number selector
  const { data: waAccountsData } = useWhatsAppAccounts()
  const waAccounts = ((waAccountsData?.data as WhatsAppAccount[] | undefined) || []).filter(a => a.status === 'active')

  // Auto-select default or first account
  const defaultWaAccount = waAccounts.find(a => a.is_default) || waAccounts[0]

  // Contacts for search
  const { data: contactsData } = useContacts({ pageSize: 200 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allContacts = (contactsData?.data || []) as any[]

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return []
    const q = contactSearch.toLowerCase()
    return allContacts
      .filter((c: { name?: string; mobile?: string; phone?: string; email?: string }) =>
        c.name?.toLowerCase().includes(q) ||
        c.mobile?.includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [contactSearch, allContacts])

  const selectedContact = allContacts.find((c: { id: string }) => c.id === newConvContactId)

  const handleNewConversation = () => {
    // Require a recipient (contact or phone number)
    if (!newConvContactId && !newConvPhone.trim()) {
      toast.error('Select a contact or enter a phone number.')
      return
    }

    // For WhatsApp, require a business phone number
    const selectedPhoneId = newConvPhoneNumberId || defaultWaAccount?.phone_number_id
    if (newConvChannel === 'whatsapp' && !selectedPhoneId) {
      toast.error('No WhatsApp number available. Add one in Settings > WhatsApp.')
      return
    }

    const metadata = newConvChannel === 'whatsapp' && selectedPhoneId
      ? {
          phone_number_id: selectedPhoneId,
          display_phone_number: waAccounts.find(a => a.phone_number_id === selectedPhoneId)?.display_phone_number || '',
          ...(newConvPhone.trim() && !newConvContactId ? { recipient_phone: newConvPhone.replace(/[^+\d]/g, '') } : {}),
        }
      : undefined

    const contactName = selectedContact?.name || newConvPhone.trim()
    const autoSubject = newConvSubject || (newConvChannel === 'whatsapp' ? `WhatsApp: ${contactName}` : contactName)

    createConversation.mutate(
      {
        channel: newConvChannel,
        subject: autoSubject || undefined,
        contact_id: newConvContactId || undefined,
        metadata,
      },
      {
        onSuccess: (data) => {
          const id = (data as { data?: { id?: string } })?.data?.id
          if (id) setActiveConversationId(id)
          setNewConvOpen(false)
          setNewConvSubject('')
          setNewConvPhoneNumberId('')
          setNewConvContactId('')
          setNewConvPhone('')
          setContactSearch('')
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
                  <SelectItem value="whatsapp">
                    <span className="inline-flex items-center gap-1.5"><WhatsAppSvgIcon className="h-3.5 w-3.5 text-green-600" /> WhatsApp</span>
                  </SelectItem>
                  <SelectItem value="email">
                    <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-blue-600" /> Email</span>
                  </SelectItem>
                  <SelectItem value="phone">
                    <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-purple-600" /> Phone</span>
                  </SelectItem>
                  <SelectItem value="sms">
                    <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-amber-600" /> SMS</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact / Recipient */}
            <div className="space-y-2">
              <Label>Recipient</Label>
              {selectedContact ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{selectedContact.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedContact.mobile || selectedContact.phone || selectedContact.email || 'No phone'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setNewConvContactId(''); setContactSearch(''); setNewConvPhone('') }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={contactSearch}
                      onChange={(e) => {
                        setContactSearch(e.target.value)
                        setShowContactDropdown(true)
                      }}
                      onFocus={() => setShowContactDropdown(true)}
                      placeholder="Search contacts by name or phone..."
                      className="pl-9"
                    />
                  </div>
                  {showContactDropdown && filteredContacts.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                      {filteredContacts.map((c: { id: string; name: string; mobile?: string; phone?: string; email?: string }) => (
                        <button
                          key={c.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                          onClick={() => {
                            setNewConvContactId(c.id)
                            setContactSearch('')
                            setNewConvPhone(c.mobile || c.phone || '')
                            setShowContactDropdown(false)
                          }}
                        >
                          <span className="font-medium">{c.name}</span>
                          {(c.mobile || c.phone) && (
                            <span className="text-muted-foreground ml-2">{c.mobile || c.phone}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Phone number — shown when no contact selected */}
            {!newConvContactId && (
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={newConvPhone}
                  onChange={(e) => setNewConvPhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground">Enter with country code (e.g. +917009721584)</p>
              </div>
            )}

            {/* WhatsApp business number selector */}
            {newConvChannel === 'whatsapp' && (
              <div className="space-y-2">
                <Label>Send From (WhatsApp Number)</Label>
                {waAccounts.length > 0 ? (
                  <Select
                    value={newConvPhoneNumberId || defaultWaAccount?.phone_number_id || ''}
                    onValueChange={setNewConvPhoneNumberId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number..." />
                    </SelectTrigger>
                    <SelectContent>
                      {waAccounts.map((acct, idx) => {
                        const provider = (acct.metadata?.provider as string) || 'chakrahq'
                        return (
                          <SelectItem key={acct.id} value={acct.phone_number_id}>
                            <span className="inline-flex items-center gap-2">
                              <WhatsAppNumberIcon className="h-3.5 w-3.5 text-green-600" number={idx + 1} />
                              <span className="ml-1">{acct.display_phone_number}</span>
                              {acct.business_name && <span className="text-muted-foreground">({acct.business_name})</span>}
                              <span className="text-muted-foreground">&mdash; {provider === 'ycloud' ? 'YCloud' : 'ChakraHQ'}</span>
                              {acct.is_default && <span className="text-xs text-green-600 font-medium">[Default]</span>}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">No WhatsApp numbers configured. Add one in Settings &gt; WhatsApp.</p>
                  </div>
                )}
              </div>
            )}

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
            <Button
              onClick={handleNewConversation}
              disabled={createConversation.isPending || (newConvChannel === 'whatsapp' && waAccounts.length === 0)}
            >
              {createConversation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
