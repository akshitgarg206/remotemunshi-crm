import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2, Users, Briefcase, Clock, Calendar, FileText,
  Shield, Bell, Key, Webhook, ClipboardCheck
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
      { label: 'API Keys', href: '/settings/api-keys', icon: Key, description: 'Manage API access' },
      { label: 'Webhooks', href: '/settings/webhooks', icon: Webhook, description: 'Event notifications' },
      { label: 'Email Templates', href: '/settings/email-templates', icon: FileText, description: 'Email formatting' },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your CRM</p>
      </div>

      {settingsGroups.map((group) => (
        <div key={group.title} className="space-y-4">
          <h2 className="text-lg font-semibold">{group.title}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
