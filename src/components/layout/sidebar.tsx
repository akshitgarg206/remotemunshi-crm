'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UserPlus, Users, Briefcase, Package, CheckSquare,
  FileKey, Award, Lock, FileText, ClipboardCheck, CalendarClock,
  UsersRound, AlertTriangle, BarChart3, Settings, ChevronLeft, ChevronRight,
  Repeat, Headphones, Grid3X3, ChevronDown, Timer, type LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  module: string | null
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: null },
      { label: 'Activity Timer', href: '/timer', icon: Timer, module: null },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Leads', href: '/leads', icon: UserPlus, module: 'leads' },
      { label: 'Clients', href: '/client', icon: Users, module: 'clients' },
      { label: 'Services', href: '/services', icon: Briefcase, module: 'services' },
      { label: 'Bundles', href: '/bundles', icon: Package, module: 'bundles' },
    ],
  },
  {
    label: 'Tasks',
    items: [
      { label: 'Tasks', href: '/task', icon: CheckSquare, module: 'tasks' },
      { label: 'Templates', href: '/task/templates', icon: Repeat, module: 'tasks' },
    ],
  },
  {
    label: 'Records',
    items: [
      { label: 'Digital Signature', href: '/digital-signature', icon: FileKey, module: 'dscs' },
      { label: 'Licenses', href: '/license', icon: Award, module: 'licenses' },
      { label: 'Passwords', href: '/passwords', icon: Lock, module: 'passwords' },
      { label: 'Documents', href: '/documents', icon: FileText, module: 'documents' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Compliance', href: '/compliance-tracker', icon: ClipboardCheck, module: 'compliance' },
      { label: 'Data Tracker', href: '/data-tracker', icon: CalendarClock, module: 'services' },
      { label: 'Matrix', href: '/compliance-matrix', icon: Grid3X3, module: 'services' },
      { label: 'Notices', href: '/notice-management', icon: AlertTriangle, module: 'notices' },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'OmniDesk', href: '/support', icon: Headphones, module: 'communications' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Team', href: '/team', icon: UsersRound, module: 'team' },
      { label: 'Reports', href: '/reports', icon: BarChart3, module: 'reports' },
      { label: 'Settings', href: '/settings', icon: Settings, module: 'settings' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, setCollapsed } = useSidebarStore()
  const { canRead, isLoading } = usePermissions()
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isItemVisible = (item: NavItem) => {
    if (!item.module) return true
    if (isLoading) return true
    return canRead(item.module)
  }

  const isGroupActive = (group: NavGroup) =>
    group.items.some(item => pathname.startsWith(item.href))

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 hidden lg:block',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <Link href="/dashboard" className={cn('flex items-center gap-2', isCollapsed && 'mx-auto')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-sm text-primary-foreground shrink-0">
            RM
          </div>
          {!isCollapsed && <span className="font-semibold text-sm">Remote Munshi</span>}
        </Link>
      </div>

      {/* Nav Groups */}
      <ScrollArea className="h-[calc(100vh-7rem)]">
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-0.5 p-2">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter(isItemVisible)
              if (visibleItems.length === 0) return null

              const groupCollapsed = collapsedGroups[group.label]
              const groupActive = isGroupActive(group)

              // Collapsed sidebar — show only icons (no group headers)
              if (isCollapsed) {
                return visibleItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg mx-auto transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  )
                })
              }

              // Expanded sidebar — show grouped items with collapsible headers
              return (
                <div key={group.label} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                      groupActive ? 'text-sidebar-foreground' : 'text-muted-foreground/70 hover:text-muted-foreground'
                    )}
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 transition-transform',
                        groupCollapsed && '-rotate-90'
                      )}
                    />
                  </button>
                  {!groupCollapsed && (
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      {visibleItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors',
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
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
