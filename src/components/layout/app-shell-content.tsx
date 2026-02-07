'use client'

import { useSidebarStore } from '@/stores/sidebar-store'
import { cn } from '@/lib/utils'

export function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore()

  return (
    <div className={cn('transition-all duration-300', isCollapsed ? 'lg:pl-16' : 'lg:pl-60')}>
      {children}
    </div>
  )
}
