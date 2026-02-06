'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Bell,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/lib/api/fetch'

/* eslint-disable @typescript-eslint/no-explicit-any */

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || '-'}</dd>
    </div>
  )
}

function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

function formatFrequency(freq: string | null | undefined): string {
  if (!freq) return '-'
  return freq.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const { data: serviceRes, isLoading } = useQuery({
    queryKey: ['services', id],
    queryFn: () => apiFetch(`/api/v1/services/${id}`),
    enabled: !!id,
  })
  const service = (serviceRes as any)?.data as Record<string, any> | undefined

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/services')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
        </Button>
        <div className="text-center py-12 text-muted-foreground">Service not found</div>
      </div>
    )
  }

  const isActive = service.is_active !== false
  const category = service.service_categories as Record<string, string> | null
  const hasDeadlineSettings = !!service.frequency
  const reminderDays = service.reminder_days as number[] | null
  const messageTemplates = service.message_templates as Record<string, string> | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/services')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{service.name}</h1>
              <Badge
                variant="secondary"
                className={isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
              >
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Name" value={service.name} />
            <DetailField label="Category" value={category?.name ? <Badge variant="secondary">{category.name}</Badge> : '-'} />
            <DetailField label="SAC Code" value={service.sac_code} />
            <DetailField label="Default Rate" value={formatINR(service.default_rate)} />
            <DetailField label="Description" value={service.description} />
          </dl>
        </CardContent>
      </Card>

      {/* Deadline Settings Card */}
      {hasDeadlineSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Deadline Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Frequency" value={formatFrequency(service.frequency)} />
              <DetailField
                label="Due Day of Month"
                value={service.due_day_of_month ? `${service.due_day_of_month}${getOrdinalSuffix(service.due_day_of_month)}` : '-'}
              />
              <DetailField
                label="Reminder Days"
                value={reminderDays?.length ? reminderDays.join(', ') + ' days before due' : '-'}
              />
              <DetailField
                label="Requires Data Collection"
                value={service.requires_data_collection ? 'Yes' : 'No'}
              />
              <DetailField label="Data Description" value={service.data_description} />
            </dl>

            {/* Message Templates */}
            {messageTemplates && Object.keys(messageTemplates).length > 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setTemplatesOpen(!templatesOpen)}
                >
                  <Bell className="h-4 w-4" />
                  Message Templates
                  {templatesOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {templatesOpen && (
                  <div className="mt-3 space-y-3">
                    {Object.entries(messageTemplates).map(([key, value]) => (
                      <div key={key} className="rounded-md border p-3">
                        <div className="text-xs font-medium text-muted-foreground capitalize mb-1">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{value as string}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
