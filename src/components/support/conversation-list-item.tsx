'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Mail, Phone } from 'lucide-react'
import { WhatsAppSvgIcon } from '@/components/icons/whatsapp-icon'
import { formatDistanceToNow } from 'date-fns'

const channelConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  whatsapp: { icon: WhatsAppSvgIcon, color: 'bg-green-500', label: 'WhatsApp' },
  email: { icon: Mail, color: 'bg-blue-500', label: 'Email' },
  phone: { icon: Phone, color: 'bg-purple-500', label: 'Phone' },
  sms: { icon: MessageCircle, color: 'bg-amber-500', label: 'SMS' },
  in_person: { icon: Phone, color: 'bg-muted-foreground', label: 'In Person' },
}

interface ConversationListItemProps {
  conversation: {
    id: string
    subject?: string
    channel: string
    status: string
    last_message_at: string
    last_message_preview?: string
    unread_count: number
    client?: { id: string; business_name: string } | null
    contact?: { id: string; name: string; email?: string; phone?: string } | null
    assigned_employee?: { id: string; name: string } | null
  }
  isActive: boolean
  onClick: () => void
}

export function ConversationListItem({ conversation, isActive, onClick }: ConversationListItemProps) {
  const channel = channelConfig[conversation.channel] || channelConfig.email
  const ChannelIcon = channel.icon
  const name = conversation.contact?.name || conversation.client?.business_name || 'Unknown'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-foreground hover:bg-accent/50'
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className={cn('absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center', channel.color)}>
          <ChannelIcon className="h-2.5 w-2.5 text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-sm truncate', conversation.unread_count > 0 && 'font-semibold')}>
            {name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {conversation.last_message_preview || conversation.subject || 'No messages yet'}
        </p>
      </div>

      {conversation.unread_count > 0 && (
        <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0 shrink-0">
          {conversation.unread_count}
        </Badge>
      )}
    </button>
  )
}
