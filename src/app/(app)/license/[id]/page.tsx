'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format, differenceInDays } from 'date-fns'
import { ArrowLeft, FileText, Building2, Hash, Landmark, Calendar, Clock, ExternalLink, StickyNote, Paperclip } from 'lucide-react'
import { apiFetch } from '@/lib/api/fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  )
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <span className="text-sm text-muted-foreground">-</span>
  const days = differenceInDays(new Date(expiryDate), new Date())
  let color = 'bg-green-100 text-green-700'
  let label = `${days} days remaining`
  if (days < 0) {
    color = 'bg-red-100 text-red-700'
    label = `Expired ${Math.abs(days)} days ago`
  } else if (days < 7) {
    color = 'bg-red-100 text-red-700'
    label = `${days} days remaining`
  } else if (days <= 30) {
    color = 'bg-yellow-100 text-yellow-700'
    label = `${days} days remaining`
  }
  return <Badge variant="secondary" className={color}>{label}</Badge>
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['licenses', id],
    queryFn: () => apiFetch(`/api/v1/licenses/${id}`),
    enabled: !!id,
  })

  if (isLoading) return <DetailSkeleton />

  const license = data?.data as Record<string, unknown> | undefined
  if (!license) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">License not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/license')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Licenses
        </Button>
      </div>
    )
  }

  const licenseName = license.license_name as string
  const client = license.clients as Record<string, string> | null
  const expiryDate = license.expiry_date as string | null
  const url = license.url as string | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/license')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{licenseName}</h1>
          <p className="text-sm text-muted-foreground">{client?.business_name || 'License'}</p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> License Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0">
              <div className="space-y-0 divide-y">
                <InfoRow icon={Building2} label="Client" value={client?.business_name} />
                <InfoRow icon={FileText} label="License Name" value={licenseName} />
                <InfoRow icon={Hash} label="Registration No." value={license.registration_no as string} />
                <InfoRow icon={Landmark} label="Issuing Authority" value={license.issuing_authority as string} />
              </div>
              <div className="space-y-0 divide-y sm:pl-6">
                <InfoRow
                  icon={Calendar}
                  label="Issued Date"
                  value={license.issued_date ? format(new Date(license.issued_date as string), 'dd MMM yyyy') : '-'}
                />
                <InfoRow
                  icon={Calendar}
                  label="Expiry Date"
                  value={expiryDate ? format(new Date(expiryDate), 'dd MMM yyyy') : '-'}
                />
                <InfoRow
                  icon={ExternalLink}
                  label="URL"
                  value={
                    url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        {url} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : '-'
                  }
                />
                <InfoRow icon={StickyNote} label="Notes" value={license.notes as string} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiry Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Expiry Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
              <ExpiryBadge expiryDate={expiryDate} />
              {expiryDate && (
                <p className="text-sm text-muted-foreground text-center">
                  Expires on {format(new Date(expiryDate), 'dd MMM yyyy')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Attachments Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" /> Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Paperclip className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No attachments</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
