'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard, ArrowUpRight, Users, BarChart3, Settings, LogOut, Search, Headphones
} from 'lucide-react'
import { SupervisorQueue } from '@/components/support/supervisor-queue'
import { ChatArea } from '@/components/support/chat-area'
import { CustomerContextPanel } from '@/components/support/customer-context-panel'
import { SupervisorToolbar } from '@/components/support/supervisor-toolbar'
import { QuickReplyPicker } from '@/components/support/quick-reply-picker'
import { AiReplyButton } from '@/components/support/ai-reply-button'
import { cn } from '@/lib/utils'

const sideNavItems = [
  { label: 'Dashboard', href: '/support', icon: LayoutDashboard },
  { label: 'Escalations', href: '/support/supervisor', icon: ArrowUpRight },
  { label: 'Agents', href: '/team', icon: Users },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
]

export default function SupervisorPage() {
  const pathname = usePathname()
  const [selectedEscalationId, setSelectedEscalationId] = useState<string | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const composerRef = useRef<{ insertText: (text: string) => void } | null>(null)

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left Nav */}
      <div className="w-56 shrink-0 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-blue-400" />
            <span className="font-semibold">Supervisor Portal</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Manage Escalations</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {sideNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t space-y-1">
          <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      {/* Queue + Chat */}
      <div className="flex-1 flex min-w-0">
        {/* Queue Column */}
        <div className="w-72 shrink-0 border-r flex flex-col">
          <div className="p-3 border-b">
            <h2 className="text-sm font-semibold mb-2">Queue</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search ID, agent, or tag..."
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <SupervisorQueue
            selectedId={selectedEscalationId}
            onSelect={(escId, convId) => {
              setSelectedEscalationId(escId)
              setSelectedConversationId(convId)
            }}
          />
        </div>

        {/* Chat Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversationId ? (
            <>
              {/* AI tools */}
              <div className="flex items-center gap-2 px-4 py-1.5 border-b bg-muted/50">
                <QuickReplyPicker onSelect={(text) => composerRef.current?.insertText(text)} />
                <AiReplyButton
                  conversationId={selectedConversationId}
                  onGenerated={(text) => composerRef.current?.insertText(text)}
                />
              </div>
              <ChatArea
                conversationId={selectedConversationId}
                composerRef={composerRef}
              />
              <SupervisorToolbar
                conversationId={selectedConversationId}
                escalationId={selectedEscalationId || undefined}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ArrowUpRight className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Select an escalation from the queue</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Context + Tools */}
      <div className="w-80 shrink-0 border-l">
        {selectedConversationId ? (
          <ScrollArea className="h-full">
            <CustomerContextPanel conversationId={selectedConversationId} />
            {/* Resolution Tools */}
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Resolution Tools</h3>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Knowledge Base
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Quick Macros
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Re-assign
              </Button>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No escalation selected
          </div>
        )}
      </div>
    </div>
  )
}
