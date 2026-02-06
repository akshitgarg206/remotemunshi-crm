'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Zap, MessageSquare, Calendar, ListTodo, ClipboardCheck,
  AlertTriangle, Bell, User, LogOut, Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSidebarStore } from '@/stores/sidebar-store'
import { createClient } from '@/lib/supabase/client'

const quickLinks = [
  { label: 'Sprint Planner', href: '/sprint-planner', icon: Zap },
  { label: 'Action Center', href: '/actions-center', icon: Bell },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'My Tasks', href: '/task?view=my_tasks', icon: ListTodo },
  { label: 'Compliance', href: '/compliance-tracker', icon: ClipboardCheck },
  { label: 'Notices', href: '/notice-management', icon: AlertTriangle },
]

export function Topbar() {
  const router = useRouter()
  const { setOpen, isOpen } = useSidebarStore()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(!isOpen)}
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

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Link href="/actions-center">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
          </Button>
        </Link>

        {/* User Menu */}
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
  )
}
