'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Building2, Users, Briefcase, Clock, Calendar, FileText,
  Shield, Bell, Key, Webhook, ClipboardCheck, ChevronRight, Phone,
  Mail, Linkedin, MessageSquare,
} from 'lucide-react'

const settingsGroups = [
  {
    title: 'Organization',
    items: [
      { label: 'Billing Organizations', href: '/settings/billing-orgs', icon: Building2, description: 'Manage billing entities' },
      { label: 'Business Hours', href: '/settings/business-hours', icon: Clock, description: 'Set working hours' },
      { label: 'Holidays', href: '/settings/holidays', icon: Calendar, description: 'Manage holiday calendar' },
      { label: 'Financial Years', href: '/settings/financial-years', icon: FileText, description: 'Configure FY periods' },
    ],
  },
  {
    title: 'Team',
    items: [
      { label: 'Departments', href: '/settings/departments', icon: Building2, description: 'Manage departments' },
      { label: 'Designations', href: '/settings/designations', icon: Users, description: 'Job titles and levels' },
      { label: 'Roles & Permissions', href: '/settings/roles', icon: Shield, description: 'Access control' },
      { label: 'Leave Types', href: '/settings/leave-types', icon: Calendar, description: 'Configure leave policies' },
    ],
  },
  {
    title: 'Modules',
    items: [
      { label: 'Service Categories', href: '/settings/service-categories', icon: Briefcase, description: 'Organize services' },
      { label: 'Lead Stages', href: '/settings/lead-stages', icon: Users, description: 'Sales pipeline stages' },
      { label: 'Task Sub-Statuses', href: '/settings/task-sub-statuses', icon: ClipboardCheck, description: 'Custom task statuses' },
      { label: 'Client Groups', href: '/settings/client-groups', icon: Users, description: 'Group clients' },
      { label: 'Notice Types', href: '/settings/notice-types', icon: Bell, description: 'Notice categories' },
    ],
  },
  {
    title: 'Integration',
    items: [
      { label: 'WhatsApp Business', href: '/settings/whatsapp', icon: Phone, description: 'Connect WhatsApp numbers' },
      { label: 'Outlook', href: '/settings/outlook', icon: Mail, description: 'Import leads from Outlook contacts, emails, and meetings' },
      { label: 'LinkedIn', href: '/settings/linkedin', icon: Linkedin, description: 'Import LinkedIn connections as leads' },
      { label: 'Reddit', href: '/settings/reddit', icon: MessageSquare, description: 'Import Reddit engagement as leads' },
      { label: 'API Keys', href: '/settings/api-keys', icon: Key, description: 'Manage API access' },
      { label: 'Webhooks', href: '/settings/webhooks', icon: Webhook, description: 'Event notifications' },
      { label: 'Email Templates', href: '/settings/email-templates', icon: FileText, description: 'Email formatting' },
    ],
  },
]

export default function SettingsPage() {
  const [activeGroup, setActiveGroup] = useState(settingsGroups[0].title)
  const currentGroup = settingsGroups.find((g) => g.title === activeGroup) || settingsGroups[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your CRM</p>
      </div>

      <div className="flex gap-6 min-h-[60vh]">
        {/* Left Sidebar Navigation */}
        <nav className="hidden md:block w-56 shrink-0 space-y-1">
          {settingsGroups.map((group) => (
            <button
              key={group.title}
              onClick={() => setActiveGroup(group.title)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                activeGroup === group.title
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{group.title}</span>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </button>
          ))}
        </nav>

        {/* Mobile: Group tabs */}
        <div className="md:hidden w-full space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {settingsGroups.map((group) => (
              <button
                key={group.title}
                onClick={() => setActiveGroup(group.title)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  activeGroup === group.title
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {group.title}
              </button>
            ))}
          </div>
          <SettingsGrid group={currentGroup} />
        </div>

        {/* Right Content Area — Desktop */}
        <div className="hidden md:block flex-1">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{currentGroup.title}</h2>
            <p className="text-sm text-muted-foreground">{currentGroup.items.length} settings</p>
          </div>
          <SettingsGrid group={currentGroup} />
        </div>
      </div>
    </div>
  )
}

function SettingsGrid({ group }: { group: typeof settingsGroups[number] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {group.items.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full group">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
