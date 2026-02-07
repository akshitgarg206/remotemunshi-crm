'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, ArrowRight } from 'lucide-react'

interface Client {
  id: string
  business_name: string
  entity_type: string | null
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {contact?.name ?? 'Guest'}</h1>
        <p className="text-muted-foreground">
          {contact?.designation ? `${contact.designation} — ` : ''}
          View your business details, task progress, and compliance status.
        </p>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No businesses linked to your account yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Contact your CA firm to enable portal access.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => router.push(`/portal/clients/${client.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{client.business_name}</CardTitle>
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status}
                  </Badge>
                </div>
                <CardDescription>
                  {[client.entity_type, client.city, client.state].filter(Boolean).join(' — ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {client.pan && <div>PAN: {client.pan}</div>}
                    {client.gstin && <div>GSTIN: {client.gstin}</div>}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
