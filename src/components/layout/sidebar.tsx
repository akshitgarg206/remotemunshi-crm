'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UserPlus, Users, Briefcase, Package, CheckSquare,
  FileKey, Award, Lock, FileText, ClipboardCheck, CalendarClock,
  UsersRound, AlertTriangle, BarChart3, Settings, ChevronLeft, ChevronRight,
  Repeat, Headphones
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: UserPlus },
  { label: 'Clients', href: '/client', icon: Users },
  { label: 'Services', href: '/services', icon: Briefcase },
  { label: 'Bundles', href: '/bundles', icon: Package },
  { label: 'Tasks', href: '/task', icon: CheckSquare },
  { label: 'Task Templates', href: '/task/templates', icon: Repeat },
  { label: 'Digital Signature', href: '/digital-signature', icon: FileKey },
  { label: 'Licenses', href: '/license', icon: Award },
  { label: 'Passwords', href: '/passwords', icon: Lock },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Compliance', href: '/compliance-tracker', icon: ClipboardCheck },
  { label: 'Data Tracker', href: '/data-tracker', icon: CalendarClock },
  { label: 'OmniDesk', href: '/support', icon: Headphones },
  { label: 'Team', href: '/team', icon: UsersRound },
  { label: 'Notices', href: '/notice-management', icon: AlertTriangle },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, setCollapsed } = useSidebarStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-sm text-primary-foreground">
              RM
            </div>
            <span className="font-semibold text-sm">Remote Munshi</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-sm text-primary-foreground">
              RM
            </div>
          </Link>
        )}
      </div>

      {/* Nav Items */}
      <ScrollArea className="h-[calc(100vh-7rem)]">
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-1 p-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg mx-auto transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!isCollapsed)}
          className={cn(
            'w-full text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
            isCollapsed && 'px-0 justify-center'
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
