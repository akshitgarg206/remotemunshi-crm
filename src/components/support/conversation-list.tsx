'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import { useConversations } from '@/hooks/queries/use-support-conversations'
import { useRealtimeConversations } from '@/hooks/use-realtime-messages'
import { useOmnideskStore } from '@/stores/omnidesk-store'
import { ConversationListItem } from './conversation-list-item'

export function ConversationList() {
  const [search, setSearch] = useState('')
  const { activeConversationId, setActiveConversationId, activeTab, setActiveTab } = useOmnideskStore()

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

  const { data, isLoading } = useConversations(filters)
  useRealtimeConversations()

  const conversations = (data?.data || []) as any[]

  return (
    <div className="flex flex-col h-full border-r">
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
            <p className="text-sm text-muted-foreground text-center py-8">No conversations</p>
          ) : (
            conversations.map((conv: Record<string, unknown>) => (
              <ConversationListItem
                key={conv.id as string}
                conversation={conv as ConversationListItemProps['conversation']}
                isActive={activeConversationId === conv.id}
                onClick={() => setActiveConversationId(conv.id as string)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Type helper for the parent reference
type ConversationListItemProps = React.ComponentProps<typeof ConversationListItem>
