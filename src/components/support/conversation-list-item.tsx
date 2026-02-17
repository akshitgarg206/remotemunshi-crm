'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageCircle, Mail, Phone, MailOpen, MailWarning, MoreVertical } from 'lucide-react'
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
  onMarkRead?: () => void
  onMarkUnread?: () => void
  /** 1-based WhatsApp account number (null for non-WA or unknown account) */
  waAccountNumber?: number | null
}

export function ConversationListItem({ conversation, isActive, onClick, onMarkRead, onMarkUnread, waAccountNumber }: ConversationListItemProps) {
  const channel = channelConfig[conversation.channel] || channelConfig.email
  const ChannelIcon = channel.icon
  const name = conversation.contact?.name || conversation.client?.business_name || 'Unknown'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const showWaNumber = conversation.channel === 'whatsapp' && waAccountNumber
  const isUnread = conversation.unread_count > 0

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-start gap-3 p-3 pr-8 rounded-lg text-left transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-foreground hover:bg-accent/50'
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          {showWaNumber ? (
            <div className="absolute -bottom-0.5 -right-1.5 h-4 rounded-full flex items-center gap-0.5 px-1 bg-green-500">
              <ChannelIcon className="h-2.5 w-2.5 text-white" />
              <span className="text-[7px] font-bold text-white leading-none">{waAccountNumber}</span>
            </div>
          ) : (
            <div className={cn('absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center', channel.color)}>
              <ChannelIcon className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('text-sm truncate', isUnread && 'font-semibold')}>
              {name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false })}
            </span>
          </div>
          <p className={cn('text-xs truncate mt-0.5', isUnread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
            {conversation.last_message_preview || conversation.subject || 'No messages yet'}
          </p>
        </div>

        {isUnread && (
          <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0 shrink-0">
            {conversation.unread_count}
          </Badge>
        )}
      </button>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {isUnread ? (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkRead?.() }}>
              <MailOpen className="h-4 w-4 mr-2" />
              Mark as read
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkUnread?.() }}>
              <MailWarning className="h-4 w-4 mr-2" />
              Mark as unread
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
