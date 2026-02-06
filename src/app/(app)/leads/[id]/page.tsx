'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, UserCheck, Phone, Mail, Globe, User, Calendar, StickyNote, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const sourceColors: Record<string, string> = {
  website: 'bg-blue-100 text-blue-700',
  referral: 'bg-green-100 text-green-700',
  social_media: 'bg-purple-100 text-purple-700',
  cold_call: 'bg-orange-100 text-orange-700',
  walk_in: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-700',
}

interface LeadService {
  id: string
  name: string
}

interface LeadStage {
  name: string
  color: string
}

interface Lead {
  id: string
  business_name: string
  contact_person: string
  contact_no: string
  email: string
  source: string
  referred_by: string | null
  notes: string | null
  created_at: string
  lead_stages: LeadStage | null
  services: LeadService[]
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['leads', id],
    queryFn: () => apiFetch<Lead>(`/api/v1/leads/${id}`),
  })

  const convertMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/v1/leads/${id}/convert`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Lead converted to client successfully')
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      router.push('/client')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to convert lead')
    },
  })

  const lead = data?.data as Lead | undefined

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Lead not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/leads')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{lead.business_name}</h1>
              {lead.lead_stages && (
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: lead.lead_stages.color + '20',
                    color: lead.lead_stages.color,
                  }}
                >
                  {lead.lead_stages.name}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Lead Details</p>
          </div>
        </div>
        <Button
          onClick={() => convertMutation.mutate()}
          disabled={convertMutation.isPending}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          {convertMutation.isPending ? 'Converting...' : 'Convert to Client'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{lead.contact_person || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{lead.contact_no || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{lead.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <Badge
                    variant="secondary"
                    className={sourceColors[lead.source] || sourceColors.other}
                  >
                    {(lead.source || 'other').replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              {lead.referred_by && (
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Referred By</p>
                    <p className="font-medium">{lead.referred_by}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {lead.created_at
                      ? format(new Date(lead.created_at), 'dd MMM yyyy')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {lead.notes && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <StickyNote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="whitespace-pre-wrap text-sm">{lead.notes}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Services Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Interested Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lead.services && lead.services.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {lead.services.map((service) => (
                  <Badge key={service.id} variant="outline">
                    {service.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No services listed</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
