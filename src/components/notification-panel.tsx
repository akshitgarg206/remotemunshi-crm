'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, CheckSquare, Calendar, Headphones, Users, AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiFetch } from '@/lib/api/fetch'
import { cn } from '@/lib/utils'

/* eslint-disable @typescript-eslint/no-explicit-any */

const typeIcons: Record<string, typeof Bell> = {
  task: CheckSquare,
  deadline: Calendar,
  support: Headphones,
  team: Users,
  notice: AlertTriangle,
  document: FileText,
}

function groupByDate(notifications: any[]): { label: string; items: any[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups: { label: string; items: any[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This Week', items: [] },
    { label: 'Earlier', items: [] },
  ]

  for (const n of notifications) {
    const date = new Date(n.created_at)
    if (date >= today) groups[0].items.push(n)
    else if (date >= yesterday) groups[1].items.push(n)
    else if (date >= weekAgo) groups[2].items.push(n)
    else groups[3].items.push(n)
  }

  return groups.filter((g) => g.items.length > 0)
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch('/api/v1/notifications?pageSize=50'),
    enabled: open,
  })

  const notifications = ((data as any)?.data || []) as any[]
  const unreadCount = notifications.filter((n: any) => !n.is_read).length
  const filtered = tab === 'unread' ? notifications.filter((n: any) => !n.is_read) : notifications

  const markAllRead = useMutation({
    mutationFn: () =>
      apiFetch('/api/v1/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ mark_all: true }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiFetch('/api/v1/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ notification_ids: [id] }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const grouped = groupByDate(filtered)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b space-y-0">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')} className="mt-2">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-7">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs h-7">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mb-3">
                <CheckCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-medium">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No {tab === 'unread' ? 'unread ' : ''}notifications.</p>
            </div>
          ) : (
            <div className="p-2">
              {grouped.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((n: any) => {
                      const Icon = typeIcons[n.type] || Bell
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (!n.is_read) markRead.mutate(n.id)
                          }}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted',
                            !n.is_read && 'bg-primary/5'
                          )}
                        >
                          <div className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5',
                            !n.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm leading-tight', !n.is_read && 'font-medium')}>
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground/70 mt-1">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {!n.is_read && (
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
