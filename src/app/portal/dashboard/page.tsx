'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, ArrowRight, MapPin, FileText, ShieldCheck } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'

interface Client {
  id: string
  business_name: string
  business_entity: string | null
  pan: string | null
  gstin: string | null
  status: string
  city: string | null
  state: string | null
}

interface Contact {
  id: string
  name: string
  email: string | null
  designation: string | null
}

export default function PortalDashboard() {
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/portal/auth/me')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setContact(res.data.contact)
          setClients(res.data.clients)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {contact?.name ?? 'Guest'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {contact?.designation ? `${contact.designation} — ` : ''}
          View your business details, task progress, and compliance status.
        </p>
      </div>

      {/* Business Cards */}
      {clients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No businesses linked</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              No businesses are linked to your account yet. Contact your CA firm to enable portal access.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Businesses</h2>
            <span className="text-sm text-muted-foreground">{clients.length} linked</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => {
              const initials = client.business_name.slice(0, 2).toUpperCase()
              const location = [client.city, client.state].filter(Boolean).join(', ')

              return (
                <Card
                  key={client.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
                  onClick={() => router.push(`/portal/clients/${client.id}`)}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Header: Avatar + Name + Status */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-bold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{client.business_name}</p>
                        {client.business_entity && (
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">
                            {client.business_entity.replace(/_/g, ' ')}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={client.status} />
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      {client.pan && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-mono text-xs">PAN: {client.pan}</span>
                        </div>
                      )}
                      {client.gstin && (
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-mono text-xs">GSTIN: {client.gstin}</span>
                        </div>
                      )}
                      {location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs">{location}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end pt-1 border-t">
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                        View Details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
