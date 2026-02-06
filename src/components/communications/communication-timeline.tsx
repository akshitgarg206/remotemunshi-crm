'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow, format, isAfter, subDays } from 'date-fns'
import {
  MessageCircle,
  Mail,
  Phone,
  Users,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface Communication {
  id: string
  channel: 'whatsapp' | 'email' | 'phone' | 'in_person' | 'sms'
  direction: 'inbound' | 'outbound'
  subject: string | null
  body: string | null
  from_contact: string | null
  to_contact: string | null
  sent_at: string
  employees: { id: string; name: string } | null
}

interface CommunicationTimelineProps {
  clientId: string
}

const CHANNELS = [
  { value: null, label: 'All' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'in_person', label: 'In Person' },
  { value: 'sms', label: 'SMS' },
] as const

const CHANNEL_CONFIG: Record<
  string,
  { icon: typeof MessageCircle; color: string; bg: string }
> = {
  whatsapp: { icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-100' },
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
  phone: { icon: Phone, color: 'text-gray-600', bg: 'bg-gray-100' },
  in_person: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  sms: { icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-100' },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  if (isAfter(date, subDays(new Date(), 7))) {
    return formatDistanceToNow(date, { addSuffix: true })
  }
  return format(date, 'dd MMM yyyy')
}

export function CommunicationTimeline({ clientId }: CommunicationTimelineProps) {
  const [activeChannel, setActiveChannel] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['communications', clientId, activeChannel],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeChannel) params.set('channel', activeChannel)
      params.set('pageSize', '50')
      const res = await fetch(
        `/api/v1/clients/${clientId}/communications?${params.toString()}`
      )
      if (!res.ok) throw new Error('Failed to fetch communications')
      const json = await res.json()
      return json.data as Communication[]
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {CHANNELS.map((ch) => (
            <Skeleton key={ch.label} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const communications = data || []

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {CHANNELS.map((ch) => (
          <Button
            key={ch.label}
            variant={activeChannel === ch.value ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => setActiveChannel(ch.value)}
          >
            {ch.label}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      {communications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No communications logged yet
        </div>
      ) : (
        <div className="space-y-3">
          {communications.map((comm) => {
            const config = CHANNEL_CONFIG[comm.channel]
            const Icon = config.icon

            return (
              <Card key={comm.id}>
                <CardContent className="flex items-start gap-4 py-4">
                  {/* Channel icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Direction arrow */}
                      {comm.direction === 'outbound' ? (
                        <ArrowUpRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {comm.direction}
                      </Badge>
                      {comm.subject && (
                        <span className="font-semibold text-sm truncate">
                          {comm.subject}
                        </span>
                      )}
                    </div>

                    {comm.body && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                        {comm.body}
                      </p>
                    )}

                    {(comm.from_contact || comm.to_contact) && (
                      <p className="text-xs text-muted-foreground">
                        {comm.from_contact || '—'} &rarr; {comm.to_contact || '—'}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {comm.employees?.name && <span>{comm.employees.name}</span>}
                      {comm.employees?.name && <span>&middot;</span>}
                      <span>{formatDate(comm.sent_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
