'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail, Phone, MapPin, Ticket, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useConversation } from '@/hooks/queries/use-support-conversations'
import { useTickets } from '@/hooks/queries/use-support-tickets'

const priorityColors: Record<string, string> = {
  low: 'bg-green-600',
  medium: 'bg-blue-600',
  high: 'bg-orange-600',
  urgent: 'bg-red-600',
}

interface CustomerContextPanelProps {
  conversationId: string
}

export function CustomerContextPanel({ conversationId }: CustomerContextPanelProps) {
  const { data: convData, isLoading: convLoading } = useConversation(conversationId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversation = convData?.data as any

  const clientId = conversation?.client_id
  const { data: ticketData } = useTickets(clientId ? { client_id: clientId, pageSize: 5 } : undefined)
  const recentTickets = (ticketData?.data || []) as any[]

  if (convLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  if (!conversation) return null

  const client = conversation.client
  const contact = conversation.contact
  const name = contact?.name || client?.business_name || 'Unknown'
  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  const sentiment = conversation.sentiment_score
  const SentimentIcon = sentiment > 0.3 ? TrendingUp : sentiment < -0.3 ? TrendingDown : Minus
  const sentimentLabel = sentiment > 0.3 ? 'Positive' : sentiment < -0.3 ? 'Negative' : 'Neutral'
  const sentimentColor = sentiment > 0.3 ? 'text-green-500' : sentiment < -0.3 ? 'text-red-500' : 'text-muted-foreground'

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{name}</h3>
                {client && client.business_name !== name && (
                  <p className="text-xs text-muted-foreground">{client.business_name}</p>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {(contact?.email || client?.email) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{contact?.email || client?.email}</span>
                </div>
              )}
              {(contact?.phone || client?.mobile) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{contact?.phone || client?.mobile}</span>
                </div>
              )}
              {(client?.city || client?.state) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{[client?.city, client?.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sentiment */}
        {sentiment !== null && sentiment !== undefined && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sentiment</span>
                <div className={`flex items-center gap-1 ${sentimentColor}`}>
                  <SentimentIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{sentimentLabel}</span>
                </div>
              </div>
              {/* Sentiment bar */}
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all"
                  style={{ width: `${((sentiment + 1) / 2) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentTickets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tickets yet</p>
            ) : (
              <div className="space-y-2">
                {recentTickets.map((ticket: Record<string, unknown>) => (
                  <div key={ticket.id as string} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{ticket.subject as string}</p>
                      <p className="text-xs text-muted-foreground">{ticket.ticket_number as string}</p>
                    </div>
                    <Badge className={`text-xs text-white shrink-0 ${priorityColors[(ticket.priority as string) || 'medium']}`}>
                      {(ticket.priority as string) || 'medium'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
