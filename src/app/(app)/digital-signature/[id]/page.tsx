'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format, differenceInDays } from 'date-fns'
import { ArrowLeft, ShieldCheck, User, Building2, MapPin, Hash, Store, Calendar, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api/fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  revoked: 'bg-gray-100 text-gray-700 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const classColors: Record<string, string> = {
  class_2: 'bg-blue-100 text-blue-700 border-blue-200',
  class_3: 'bg-purple-100 text-purple-700 border-purple-200',
}

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
        <Skeleton className="h-6 w-20" />
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

export default function DscDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['dscs', id],
    queryFn: () => apiFetch(`/api/v1/dscs/${id}`),
    enabled: !!id,
  })

  if (isLoading) return <DetailSkeleton />

  const dsc = data?.data as Record<string, unknown> | undefined
  if (!dsc) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">DSC not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/digital-signature')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Digital Signatures
        </Button>
      </div>
    )
  }

  const holderName = dsc.holder_name as string
  const status = dsc.status as string
  const dscClass = dsc.class as string
  const client = dsc.clients as Record<string, string> | null
  const expiryDate = dsc.expiry_date as string | null
  const classLabel = (dscClass || '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/digital-signature')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{holderName}</h1>
            <p className="text-sm text-muted-foreground">{client?.business_name || 'Digital Signature Certificate'}</p>
          </div>
          <Badge variant="secondary" className={classColors[dscClass] || 'bg-gray-100 text-gray-700'}>
            {classLabel}
          </Badge>
          <Badge variant="secondary" className={statusColors[status] || ''}>
            {status}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Certificate Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0">
              <div className="space-y-0 divide-y">
                <InfoRow icon={Building2} label="Client" value={client?.business_name} />
                <InfoRow icon={User} label="Holder Name" value={holderName} />
                <InfoRow
                  icon={ShieldCheck}
                  label="Class"
                  value={<Badge variant="secondary" className={classColors[dscClass] || ''}>{classLabel}</Badge>}
                />
                <InfoRow
                  icon={Calendar}
                  label="Issued Date"
                  value={dsc.issued_date ? format(new Date(dsc.issued_date as string), 'dd MMM yyyy') : '-'}
                />
                <InfoRow
                  icon={Calendar}
                  label="Expiry Date"
                  value={expiryDate ? format(new Date(expiryDate), 'dd MMM yyyy') : '-'}
                />
              </div>
              <div className="space-y-0 divide-y sm:pl-6">
                <InfoRow icon={MapPin} label="Location" value={(dsc.location as string || '').replace(/_/g, ' ')} />
                <InfoRow icon={Hash} label="BIN Number" value={dsc.bin_number as string} />
                <InfoRow icon={Store} label="Vendor" value={dsc.vendor as string} />
                <InfoRow
                  icon={ShieldCheck}
                  label="Status"
                  value={<Badge variant="secondary" className={statusColors[status] || ''}>{status}</Badge>}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiry Card */}
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
      </div>
    </div>
  )
}
