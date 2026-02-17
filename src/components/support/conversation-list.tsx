'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Inbox, Mail, Phone, MessageCircle } from 'lucide-react'
import { WhatsAppSvgIcon, WhatsAppNumberIcon } from '@/components/icons/whatsapp-icon'
import { useConversations, useMarkConversationRead } from '@/hooks/queries/use-support-conversations'
import { useRealtimeConversations } from '@/hooks/use-realtime-messages'
import { useOmnideskStore, type Channel } from '@/stores/omnidesk-store'
import { useWhatsAppAccounts } from '@/hooks/queries/use-whatsapp-accounts'
import { useConversationCounts } from '@/hooks/queries/use-conversation-counts'
import { ConversationListItem } from './conversation-list-item'
import { cn } from '@/lib/utils'

const channelTabs: { key: Channel | null; label: string; icon: React.ElementType; color: string; activeColor: string }[] = [
  { key: null, label: 'All', icon: Inbox, color: 'text-muted-foreground', activeColor: 'text-primary border-primary bg-primary/10' },
  { key: 'whatsapp', label: 'WhatsApp', icon: WhatsAppSvgIcon, color: 'text-muted-foreground', activeColor: 'text-green-600 border-green-500 bg-green-500/10 dark:text-green-400' },
  { key: 'email', label: 'Email', icon: Mail, color: 'text-muted-foreground', activeColor: 'text-blue-600 border-blue-500 bg-blue-500/10 dark:text-blue-400' },
  { key: 'phone', label: 'Phone', icon: Phone, color: 'text-muted-foreground', activeColor: 'text-purple-600 border-purple-500 bg-purple-500/10 dark:text-purple-400' },
  { key: 'sms', label: 'SMS', icon: MessageCircle, color: 'text-muted-foreground', activeColor: 'text-amber-600 border-amber-500 bg-amber-500/10 dark:text-amber-400' },
]

const emptyMessages: Record<string, string> = {
  all: 'No conversations',
  whatsapp: 'No WhatsApp conversations',
  email: 'No email conversations',
  phone: 'No phone conversations',
  sms: 'No SMS conversations',
}

export function ConversationList() {
  const [search, setSearch] = useState('')
  const {
    activeConversationId, setActiveConversationId,
    activeTab, setActiveTab,
    selectedChannel, setSelectedChannel,
    selectedPhoneNumberId, setSelectedPhoneNumberId,
  } = useOmnideskStore()

  const { data: accountsData } = useWhatsAppAccounts()
  const { data: countsData } = useConversationCounts()
  const accounts = (accountsData?.data || accountsData || []) as Array<{
    id: string; phone_number_id: string; display_phone_number: string;
    business_name: string | null; status: string; metadata?: Record<string, unknown>
  }>
  const activeAccounts = accounts.filter(a => a.status === 'active')
  const counts = (countsData?.data || countsData || {}) as Record<string, number>

  // Map phone_number_id → account number (1-based) for WhatsApp badge display
  const waAccountMap = useMemo(() => {
    const map: Record<string, number> = {}
    activeAccounts.forEach((acc, idx) => { map[acc.phone_number_id] = idx + 1 })
    return map
  }, [activeAccounts])

  const filters: Record<string, string | number | undefined> = {
    search: search || undefined,
    sortBy: 'last_message_at',
    sortOrder: 'desc',
    pageSize: 50,
  }

  if (activeTab === 'spam') {
    filters.is_spam = 'true'
  } else {
    filters.is_spam = 'false'
  }

  // Apply channel filter
  if (selectedChannel) {
    filters.channel = selectedChannel
  }

  // Apply WhatsApp handle filter
  if (selectedChannel === 'whatsapp' && selectedPhoneNumberId) {
    filters.phone_number_id = selectedPhoneNumberId
  }

  const { data, isLoading } = useConversations(filters)
  useRealtimeConversations()
  const markRead = useMarkConversationRead()

  const conversations = (data?.data || []) as any[]

  const handleSelect = (convId: string, unreadCount: number) => {
    setActiveConversationId(convId)
    if (unreadCount > 0) {
      markRead.mutate({ conversationId: convId })
    }
  }

  return (
    <div className="flex flex-col h-full border-r">
      {/* Channel Filter Bar */}
      <div className="px-3 pt-3 pb-2 border-b">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {channelTabs.map((tab) => {
            const isActive = selectedChannel === tab.key
            const Icon = tab.icon
            const count = tab.key === null ? counts.total : counts[tab.key]
            return (
              <button
                key={tab.key ?? 'all'}
                onClick={() => setSelectedChannel(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0',
                  isActive
                    ? tab.activeColor
                    : 'border-transparent hover:bg-accent text-muted-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {count !== undefined && count > 0 && (
                  <span className={cn(
                    'ml-0.5 px-1.5 py-0 rounded-full text-[10px] leading-4',
                    isActive ? 'bg-foreground/10' : 'bg-muted'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* WhatsApp Handle Selector */}
        {selectedChannel === 'whatsapp' && activeAccounts.length > 0 && (
          <div className="mt-2">
            <Select
              value={selectedPhoneNumberId || '__all__'}
              onValueChange={(v) => setSelectedPhoneNumberId(v === '__all__' ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Numbers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Numbers</SelectItem>
                {activeAccounts.map((acc, idx) => {
                  const provider = (acc.metadata?.provider as string) || 'meta'
                  return (
                    <SelectItem key={acc.phone_number_id} value={acc.phone_number_id}>
                      <span className="flex items-center gap-2">
                        <WhatsAppNumberIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" number={idx + 1} />
                        <span className="ml-1">{acc.display_phone_number}</span>
                        {acc.business_name && (
                          <span className="text-muted-foreground">({acc.business_name})</span>
                        )}
                        <span className={cn(
                          'px-1.5 py-0 rounded text-[10px] font-medium uppercase',
                          provider === 'ycloud' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : provider === 'chakrahq' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        )}>
                          {provider}
                        </span>
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations, tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 pt-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'inbox' | 'mentions' | 'spam')}>
          <TabsList className="w-full">
            <TabsTrigger value="inbox" className="flex-1 text-xs">
              Inbox
            </TabsTrigger>
            <TabsTrigger value="mentions" className="flex-1 text-xs">
              Mentions
            </TabsTrigger>
            <TabsTrigger value="spam" className="flex-1 text-xs">
              Spam
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {emptyMessages[selectedChannel || 'all']}
            </p>
          ) : (
            conversations.map((conv: Record<string, unknown>) => {
              const meta = conv.metadata as Record<string, string> | null
              const pnId = meta?.phone_number_id
              const convId = conv.id as string
              return (
                <ConversationListItem
                  key={convId}
                  conversation={conv as ConversationListItemProps['conversation']}
                  isActive={activeConversationId === convId}
                  onClick={() => handleSelect(convId, (conv.unread_count as number) || 0)}
                  onMarkRead={() => markRead.mutate({ conversationId: convId })}
                  onMarkUnread={() => markRead.mutate({ conversationId: convId, unread: true })}
                  waAccountNumber={conv.channel === 'whatsapp' && pnId ? waAccountMap[pnId] ?? null : null}
                />
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Type helper for the parent reference
type ConversationListItemProps = React.ComponentProps<typeof ConversationListItem>
