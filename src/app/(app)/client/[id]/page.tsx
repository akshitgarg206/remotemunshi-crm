'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Pencil,
  Building2,
  Phone,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  Plus,
  X,
  Users,
  Repeat,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useClient } from '@/hooks/queries/use-clients'
import { apiFetch } from '@/lib/api/fetch'
import { CommunicationTimeline } from '@/components/communications/communication-timeline'
import { LogCommunicationDialog } from '@/components/communications/log-communication-dialog'
import { useClientContacts, useCreateContact, useLinkContact, useUnlinkContact } from '@/hooks/queries/use-contacts'
import { useClientTemplateOverrides, useUpsertOverride, useDeleteOverride } from '@/hooks/queries/use-client-template-overrides'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ---------------------------------------------------------------------------
// Color Maps
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-700',
}

const taskStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  in_review: 'bg-purple-100 text-purple-700',
  on_hold: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

const taskPriorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const docDirectionColors: Record<string, string> = {
  in: 'bg-blue-100 text-blue-700',
  out: 'bg-orange-100 text-orange-700',
  returned: 'bg-gray-100 text-gray-700',
}

const complianceStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  filed: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
}

const noticeStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  responded: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  overdue: 'bg-red-100 text-red-700',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return '-'
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">{message}</div>
  )
}

function TableSkeleton({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Password Cell (with reveal toggle)
// ---------------------------------------------------------------------------

function PasswordCell({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-sm">
        {revealed ? value : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setRevealed(!revealed)}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Detail Field
// ---------------------------------------------------------------------------

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || '-'}</dd>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: clientRes, isLoading: clientLoading } = useClient(id)
  const client = clientRes?.data as Record<string, any> | undefined

  // ---- Sub-queries for each tab ----

  const { data: servicesRes, isLoading: servicesLoading } = useQuery({
    queryKey: ['clients', id, 'services'],
    queryFn: () => apiFetch(`/api/v1/services?client_id=${id}`),
    enabled: !!id,
  })
  const services = (servicesRes?.data ?? []) as any[]

  const { data: tasksRes, isLoading: tasksLoading } = useQuery({
    queryKey: ['clients', id, 'tasks'],
    queryFn: () => apiFetch(`/api/v1/tasks?client_id=${id}`),
    enabled: !!id,
  })
  const tasks = (tasksRes?.data ?? []) as any[]

  const { data: dscsRes, isLoading: dscsLoading } = useQuery({
    queryKey: ['clients', id, 'dscs'],
    queryFn: () => apiFetch(`/api/v1/dscs?client_id=${id}`),
    enabled: !!id,
  })
  const dscs = (dscsRes?.data ?? []) as any[]

  const { data: licensesRes, isLoading: licensesLoading } = useQuery({
    queryKey: ['clients', id, 'licenses'],
    queryFn: () => apiFetch(`/api/v1/licenses?client_id=${id}`),
    enabled: !!id,
  })
  const licenses = (licensesRes?.data ?? []) as any[]

  const { data: passwordsRes, isLoading: passwordsLoading } = useQuery({
    queryKey: ['clients', id, 'passwords'],
    queryFn: () => apiFetch(`/api/v1/clients/${id}?include=passwords`),
    enabled: !!id,
  })
  const passwords = (passwordsRes?.data as any)?.passwords ?? (Array.isArray(passwordsRes?.data) ? passwordsRes?.data : []) as any[]

  const { data: documentsRes, isLoading: documentsLoading } = useQuery({
    queryKey: ['clients', id, 'documents'],
    queryFn: () => apiFetch(`/api/v1/doc-in-out?client_id=${id}`),
    enabled: !!id,
  })
  const documents = (documentsRes?.data ?? []) as any[]

  const { data: complianceRes, isLoading: complianceLoading } = useQuery({
    queryKey: ['clients', id, 'compliance'],
    queryFn: () => apiFetch(`/api/v1/compliance?client_id=${id}`),
    enabled: !!id,
  })
  const compliance = (complianceRes?.data ?? []) as any[]

  const { data: noticesRes, isLoading: noticesLoading } = useQuery({
    queryKey: ['clients', id, 'notices'],
    queryFn: () => apiFetch(`/api/v1/notices?client_id=${id}`),
    enabled: !!id,
  })
  const notices = (noticesRes?.data ?? []) as any[]

  const { data: bundlesRes, isLoading: bundlesLoading } = useQuery({
    queryKey: ['clients', id, 'bundles'],
    queryFn: () => apiFetch(`/api/v1/clients/${id}/bundles`),
    enabled: !!id,
  })
  const bundles = (bundlesRes?.data ?? []) as any[]

  const { data: deadlinesRes, isLoading: deadlinesLoading } = useQuery({
    queryKey: ['clients', id, 'deadlines'],
    queryFn: () => apiFetch(`/api/v1/deadlines?client_id=${id}`),
    enabled: !!id,
  })
  const deadlines = (deadlinesRes?.data ?? []) as any[]

  const [logCommOpen, setLogCommOpen] = useState(false)

  // ---- Loading state for header ----
  if (clientLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/client')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Client not found
        </div>
      </div>
    )
  }

  const clientStatus = (client.status as string) || 'active'

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/client')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {client.business_name || client.contact_name || 'Unnamed Client'}
              </h1>
              <Badge
                variant="secondary"
                className={statusColors[clientStatus] || ''}
              >
                {clientStatus.replace(/_/g, ' ')}
              </Badge>
            </div>
            {client.business_name && client.contact_name && (
              <p className="text-muted-foreground mt-1">{client.contact_name}</p>
            )}
          </div>
        </div>
        <Button onClick={() => router.push(`/client/${id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit Client
        </Button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Quick Info Cards                                                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid gap-4 md:grid-cols-3">
        {client.mobile && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Mobile</p>
                <p className="font-medium">{client.mobile}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {client.email && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {(client.city || client.state) && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">
                  {[client.city, client.state].filter(Boolean).join(', ')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Tabs                                                              */}
      {/* ----------------------------------------------------------------- */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="dscs">DSCs</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="passwords">Passwords</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="template-overrides">Template Notes</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        {/* ----- Tab 1: Overview ----- */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                <DetailField label="Business Name" value={client.business_name} />
                <DetailField label="Contact Person" value={client.contact_name} />
                <DetailField label="Mobile" value={client.mobile} />
                <DetailField label="Email" value={client.email} />
                <DetailField
                  label="Entity Type"
                  value={
                    client.business_entity ? (
                      <span className="capitalize">
                        {(client.business_entity as string).replace(/_/g, ' ')}
                      </span>
                    ) : null
                  }
                />
                <DetailField label="GSTIN" value={client.gstin} />
                <DetailField label="PAN" value={client.pan} />
                <DetailField label="TAN" value={client.tan} />
                <DetailField label="CIN" value={client.cin} />
                <DetailField label="Address" value={client.address} />
                <DetailField label="City" value={client.city} />
                <DetailField label="State" value={client.state} />
                <DetailField label="Pincode" value={client.pincode} />
                <DetailField
                  label="Status"
                  value={
                    <Badge
                      variant="secondary"
                      className={statusColors[clientStatus] || ''}
                    >
                      {clientStatus.replace(/_/g, ' ')}
                    </Badge>
                  }
                />
                <DetailField
                  label="Created At"
                  value={formatDate(client.created_at as string)}
                />
              </dl>
              {client.notes && (
                <div className="mt-6 border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- Tab 2: Services ----- */}
        <TabsContent value="services" className="space-y-4">
          {servicesLoading ? (
            <TableSkeleton cols={4} />
          ) : services.length ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>SAC Code</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name || s.service_name}</TableCell>
                        <TableCell>{s.category || '-'}</TableCell>
                        <TableCell>{s.sac_code || '-'}</TableCell>
                        <TableCell className="text-right">
                          {s.rate != null ? `\u20B9${Number(s.rate).toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No services assigned" />
          )}
        </TabsContent>

        {/* ----- Tab 3: Tasks ----- */}
        <TabsContent value="tasks" className="space-y-4">
          {tasksLoading ? (
            <TableSkeleton cols={5} />
          ) : tasks.length ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Assignee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name || t.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={taskStatusColors[t.status] || ''}
                          >
                            {(t.status || '').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={taskPriorityColors[t.priority] || ''}
                          >
                            {t.priority || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(t.due_date)}</TableCell>
                        <TableCell>{t.assignee_name || t.assignee || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No tasks found" />
          )}
        </TabsContent>

        {/* ----- Tab 4: DSCs ----- */}
        <TabsContent value="dscs" className="space-y-4">
          {dscsLoading ? (
            <TableSkeleton cols={5} />
          ) : dscs.length ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holder Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dscs.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.holder_name || '-'}</TableCell>
                        <TableCell>{d.class || d.dsc_class || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusColors[d.status] || ''}
                          >
                            {(d.status || '').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(d.expiry_date)}</TableCell>
                        <TableCell>{d.location || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No digital signature certificates found" />
          )}
        </TabsContent>

        {/* ----- Tab 6: Licenses ----- */}
        <TabsContent value="licenses" className="space-y-4">
          {licensesLoading ? (
            <TableSkeleton cols={4} />
          ) : licenses.length ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License Name</TableHead>
                      <TableHead>Reg No</TableHead>
                      <TableHead>Issuing Authority</TableHead>
                      <TableHead>Expiry Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.name || l.license_name || '-'}</TableCell>
                        <TableCell>{l.reg_no || l.registration_number || '-'}</TableCell>
                        <TableCell>{l.issuing_authority || '-'}</TableCell>
                        <TableCell>{formatDate(l.expiry_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No licenses found" />
          )}
        </TabsContent>

        {/* ----- Tab 7: Passwords ----- */}
        <TabsContent value="passwords" className="space-y-4">
          {passwordsLoading ? (
            <TableSkeleton cols={4} />
          ) : (Array.isArray(passwords) && passwords.length) ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passwords.map((p: any, idx: number) => (
                      <TableRow key={p.id || idx}>
                        <TableCell className="font-medium">{p.name || p.portal_name || '-'}</TableCell>
                        <TableCell>{p.username || '-'}</TableCell>
                        <TableCell>
                          {p.password ? (
                            <PasswordCell value={p.password} />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {p.link || p.url ? (
                            <a
                              href={p.link || p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {p.link || p.url}
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{p.remark || p.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No passwords stored" />
          )}
        </TabsContent>

        {/* ----- Tab 8: Documents ----- */}
        <TabsContent value="documents" className="space-y-4">
          {documentsLoading ? (
            <TableSkeleton cols={4} />
          ) : documents.length ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.document_name || doc.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={docDirectionColors[doc.direction] || ''}
                          >
                            {doc.direction || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.person || doc.person_name || '-'}</TableCell>
                        <TableCell>{formatDate(doc.date || doc.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No documents found" />
          )}
        </TabsContent>

        {/* ----- Tab 9: Compliance ----- */}
        <TabsContent value="compliance" className="space-y-4">
          {complianceLoading ? (
            <TableSkeleton cols={6} />
          ) : compliance.length ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Form</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Filed Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compliance.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.type || c.compliance_type || '-'}
                        </TableCell>
                        <TableCell>{c.form || c.form_name || '-'}</TableCell>
                        <TableCell>{c.period || '-'}</TableCell>
                        <TableCell>{formatDate(c.due_date)}</TableCell>
                        <TableCell>{formatDate(c.filed_date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={complianceStatusColors[c.status] || ''}
                          >
                            {(c.status || '').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No compliance records found" />
          )}
        </TabsContent>

        {/* ----- Tab 10: Notices ----- */}
        <TabsContent value="notices" className="space-y-4">
          {noticesLoading ? (
            <TableSkeleton cols={5} />
          ) : notices.length ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Notice Type</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Assessment Year</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notices.map((n: any) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-medium">
                          {n.notice_type || n.type || '-'}
                        </TableCell>
                        <TableCell>{n.section || '-'}</TableCell>
                        <TableCell>{n.assessment_year || '-'}</TableCell>
                        <TableCell>{formatDate(n.due_date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={noticeStatusColors[n.status] || ''}
                          >
                            {(n.status || '').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No notices found" />
          )}
        </TabsContent>

        {/* ----- Tab 11: Bundles ----- */}
        <TabsContent value="bundles" className="space-y-4">
          {bundlesLoading ? (
            <TableSkeleton cols={4} />
          ) : bundles.length ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bundle Name</TableHead>
                      <TableHead className="text-right">Agreed Price</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundles.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">
                          {b.service_bundles?.name || b.bundle_name || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {b.agreed_price != null
                            ? `\u20B9${Number(b.agreed_price).toLocaleString('en-IN')}`
                            : '-'}
                        </TableCell>
                        <TableCell>{formatDate(b.start_date)}</TableCell>
                        <TableCell>{formatDate(b.end_date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              b.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }
                          >
                            {b.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No bundles assigned" />
          )}
        </TabsContent>

        {/* ----- Tab 12: Deadlines ----- */}
        <TabsContent value="deadlines" className="space-y-4">
          {deadlinesLoading ? (
            <TableSkeleton cols={5} />
          ) : deadlines.length ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Data Received</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deadlines.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          {d.services?.name || d.service_name || '-'}
                        </TableCell>
                        <TableCell>{d.period_label || '-'}</TableCell>
                        <TableCell>{formatDate(d.due_date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={d.data_received ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                          >
                            {d.data_received ? 'Received' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={complianceStatusColors[d.status] || ''}
                          >
                            {(d.status || '').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="No deadlines found" />
          )}
        </TabsContent>

        {/* ----- Tab: Contacts ----- */}
        <TabsContent value="contacts" className="space-y-4">
          <ContactsTab clientId={id} />
        </TabsContent>

        {/* ----- Tab: Template Overrides ----- */}
        <TabsContent value="template-overrides" className="space-y-4">
          <TemplateOverridesTab clientId={id} />
        </TabsContent>

        {/* ----- Tab 13: Communications ----- */}
        <TabsContent value="communications" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setLogCommOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Communication
            </Button>
          </div>
          <CommunicationTimeline clientId={id} />
          <LogCommunicationDialog
            clientId={id}
            open={logCommOpen}
            onOpenChange={setLogCommOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contacts Tab Component
// ---------------------------------------------------------------------------

function ContactsTab({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient()
  const { data: contactsRes, isLoading } = useClientContacts(clientId)
  const contacts = (contactsRes?.data ?? []) as any[]
  const unlinkContact = useUnlinkContact(clientId)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newMobile, setNewMobile] = useState('')
  const [newDesignation, setNewDesignation] = useState('')
  const [newRole, setNewRole] = useState('')

  const createAndLink = useMutation({
    mutationFn: async (data: { name: string; email?: string; mobile?: string; designation?: string; role?: string }) => {
      // Create the contact
      const res = await apiFetch('/api/v1/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email || undefined,
          mobile: data.mobile || undefined,
          designation: data.designation || undefined,
          client_ids: [{ client_id: clientId, role: data.role || undefined, is_primary: false }],
        }),
      })
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'contacts'] })
      toast.success('Contact added')
      setAddOpen(false)
      setNewName('')
      setNewEmail('')
      setNewMobile('')
      setNewDesignation('')
      setNewRole('')
    },
    onError: () => toast.error('Failed to add contact'),
  })

  async function handleUnlink(contactId: string) {
    try {
      await unlinkContact.mutateAsync(contactId)
      toast.success('Contact unlinked')
    } catch {
      toast.error('Failed to unlink contact')
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Contact
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton cols={5} />
      ) : contacts.length ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((cc: any) => {
                  const c = cc.contacts
                  return (
                    <TableRow key={cc.id}>
                      <TableCell className="font-medium">{c?.name || '-'}</TableCell>
                      <TableCell>{c?.email || '-'}</TableCell>
                      <TableCell>{c?.mobile || '-'}</TableCell>
                      <TableCell>{c?.designation || '-'}</TableCell>
                      <TableCell>
                        {cc.role ? (
                          <Badge variant="secondary">{cc.role.replace(/_/g, ' ')}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUnlink(c?.id)}
                          title="Remove from client"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState message="No contacts linked. Add contacts to manage multiple contact persons for this client." />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Name *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contact name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input value={newMobile} onChange={(e) => setNewMobile(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)} placeholder="e.g. Director, Accountant" />
              </div>
              <div className="space-y-2">
                <Label>Role for this client</Label>
                <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. owner, signatory" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createAndLink.mutate({ name: newName, email: newEmail, mobile: newMobile, designation: newDesignation, role: newRole })}
              disabled={!newName.trim() || createAndLink.isPending}
            >
              {createAndLink.isPending ? 'Adding...' : 'Add Contact'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Template Overrides Tab Component
// ---------------------------------------------------------------------------

function TemplateOverridesTab({ clientId }: { clientId: string }) {
  const { data: overridesRes, isLoading } = useClientTemplateOverrides(clientId)
  const overrides = (overridesRes?.data ?? []) as any[]
  const upsertOverride = useUpsertOverride(clientId)
  const deleteOverrideMut = useDeleteOverride(clientId)
  const [editOpen, setEditOpen] = useState(false)
  const [editTemplateId, setEditTemplateId] = useState('')
  const [editTemplateName, setEditTemplateName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editSteps, setEditSteps] = useState<string[]>([])

  // Fetch active templates for selection
  const { data: templatesRes } = useQuery({
    queryKey: ['task-templates-for-overrides'],
    queryFn: () => apiFetch('/api/v1/task-templates?is_active=true&pageSize=200'),
  })
  const templates = (templatesRes?.data ?? []) as any[]

  function openEdit(override?: any) {
    if (override) {
      setEditTemplateId(override.recurring_task_id)
      setEditTemplateName(override.recurring_tasks?.task_name || '')
      setEditNotes(override.notes || '')
      const steps = (override.additional_steps as { title: string }[]) || []
      setEditSteps(steps.map(s => s.title))
    } else {
      setEditTemplateId('')
      setEditTemplateName('')
      setEditNotes('')
      setEditSteps([''])
    }
    setEditOpen(true)
  }

  async function handleSave() {
    if (!editTemplateId) return
    const additional_steps = editSteps
      .map(s => s.trim())
      .filter(Boolean)
      .map((title, i) => ({ title, sort_order: i }))

    try {
      await upsertOverride.mutateAsync({
        recurring_task_id: editTemplateId,
        additional_steps,
        notes: editNotes || undefined,
      })
      toast.success('Template override saved')
      setEditOpen(false)
    } catch {
      toast.error('Failed to save override')
    }
  }

  async function handleDelete(templateId: string) {
    try {
      await deleteOverrideMut.mutateAsync(templateId)
      toast.success('Override removed')
    } catch {
      toast.error('Failed to remove override')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add per-client notes and additional steps for task templates. These are merged into generated tasks.
        </p>
        <Button size="sm" onClick={() => openEdit()}>
          <Plus className="h-4 w-4 mr-2" /> Add Override
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton cols={4} />
      ) : overrides.length ? (
        <div className="space-y-3">
          {overrides.map((ov: any) => (
            <Card key={ov.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    {ov.recurring_tasks?.task_name || 'Unknown template'}
                    {ov.recurring_tasks?.services?.name && (
                      <Badge variant="secondary" className="text-xs">{ov.recurring_tasks.services.name}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(ov)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(ov.recurring_task_id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {ov.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Client Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{ov.notes}</p>
                  </div>
                )}
                {(ov.additional_steps as any[])?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Additional Steps</p>
                    <div className="space-y-1 mt-1">
                      {(ov.additional_steps as any[]).map((step: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground w-5">{i + 1}.</span>
                          <span>{step.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="No template overrides. Add overrides to customize task templates for this client." />
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editTemplateId && editTemplateName ? `Edit: ${editTemplateName}` : 'Add Template Override'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editTemplateName && (
              <div className="space-y-2">
                <Label>Template *</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editTemplateId}
                  onChange={(e) => setEditTemplateId(e.target.value)}
                >
                  <option value="">Select template...</option>
                  {templates
                    .filter((t: any) => !overrides.some((o: any) => o.recurring_task_id === t.id))
                    .map((t: any) => (
                      <option key={t.id} value={t.id}>{t.task_name} {t.services?.name ? `(${t.services.name})` : ''}</option>
                    ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Client-Specific Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                placeholder="Notes specific to this client's implementation of the template..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Additional Steps</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditSteps([...editSteps, ''])}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {editSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No additional steps. These are appended to the template&apos;s default steps.</p>
              ) : (
                editSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-5">{i + 1}.</span>
                    <Input
                      value={step}
                      onChange={(e) => { const u = [...editSteps]; u[i] = e.target.value; setEditSteps(u) }}
                      placeholder={`Additional step ${i + 1}`}
                      className="flex-1"
                    />
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditSteps(editSteps.filter((_, j) => j !== i))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editTemplateId || upsertOverride.isPending}>
              {upsertOverride.isPending ? 'Saving...' : 'Save Override'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
