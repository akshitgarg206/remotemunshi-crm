'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, UserPlus, Users, Briefcase, Package, CheckSquare,
  FileKey, Award, Lock, FileText, ClipboardCheck, CalendarClock,
  UsersRound, AlertTriangle, BarChart3, Settings, Repeat, Headphones, Grid3X3,
  Zap, ListTodo, Bell, User, LogOut, Menu, Search, Timer, type LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSidebarStore } from '@/stores/sidebar-store'
import { usePermissions } from '@/hooks/use-permissions'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { NotificationPanel } from '@/components/notification-panel'
import { TimerWidget } from '@/components/activity-timer/timer-widget'

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

const quickLinks = [
  { label: 'Sprint Planner', href: '/sprint-planner', icon: Zap },
  { label: 'Action Center', href: '/actions-center', icon: Bell },
  { label: 'My Tasks', href: '/task?view=my_tasks', icon: ListTodo },
  { label: 'Compliance', href: '/compliance-tracker', icon: ClipboardCheck },
  { label: 'Notices', href: '/notice-management', icon: AlertTriangle },
]

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, setOpen } = useSidebarStore()
  const { canRead, isLoading } = usePermissions()
  const supabase = createClient()

  const isItemVisible = (item: NavItem) => {
    if (!item.module) return true
    if (isLoading) return true
    return canRead(item.module)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Quick Links */}
        <nav className="hidden md:flex items-center gap-1">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Spacer for mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right side */}
        <div className="flex items-center gap-1">
          <TimerWidget />
          <ThemeToggle />
          <NotificationPanel />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile sidebar drawer — grouped navigation */}
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-sm text-primary-foreground">
                RM
              </div>
              Remote Munshi
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <nav className="flex flex-col gap-1 p-3">
              {navGroups.map((group) => {
                const visibleItems = group.items.filter(isItemVisible)
                if (visibleItems.length === 0) return null

                return (
                  <div key={group.label} className="mb-1">
                    <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.label}
                    </p>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      {visibleItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
