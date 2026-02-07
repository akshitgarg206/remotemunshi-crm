'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Building2, FileText, CheckSquare, CalendarClock, Shield, KeySquare, Scale, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Types matching actual DB columns
interface Client {
  id: string
  business_name: string
  business_entity: string | null
  pan: string | null
  gstin: string | null
  tan: string | null
  cin: string | null
  email: string | null
  mobile: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  status: string
  client_services: { service_id: string; services: { id: string; name: string } }[]
}

interface Task {
  id: string; task_name: string; status: string; priority: string; due_date: string | null; created_at: string; services: { name: string } | null
}

interface Deadline {
  id: string; period_label: string; due_date: string; status: string; data_received: boolean; notes: string | null; services: { name: string } | null
}

interface ComplianceEntry {
  id: string; compliance_type: string; form_name: string | null; period: string | null; status: string; due_date: string | null; filed_date: string | null; acknowledgement_no: string | null
}

interface DSC {
  id: string; holder_name: string; pan: string | null; class: string | null; vendor: string | null; issued_date: string | null; expiry_date: string | null; status: string
}

interface License {
  id: string; license_name: string | null; license_type: string | null; registration_no: string | null; issuing_authority: string | null; issued_date: string | null; expiry_date: string | null
}

interface Notice {
  id: string; section: string | null; assessment_year: string | null; date_of_issue: string | null; due_date: string | null; status: string; remarks: string | null; notice_types: { name: string } | null
}

interface Document {
  id: string; document_name: string | null; person: string | null; date: string; direction: string; returned_date: string | null; remarks: string | null
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusColor: Record<string, string> = {
  active: 'default', completed: 'default', filed: 'default', valid: 'default',
  pending: 'secondary', in_progress: 'secondary', data_pending: 'secondary', open: 'secondary',
  overdue: 'destructive', expired: 'destructive', revoked: 'destructive',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={(statusColor[status] as 'default' | 'secondary' | 'destructive') ?? 'outline'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

export default function PortalClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [compliance, setCompliance] = useState<ComplianceEntry[]>([])
  const [dscs, setDscs] = useState<DSC[]>([])
  const [licenses, setLicenses] = useState<License[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const base = `/api/v1/portal/clients/${id}`
    Promise.all([
      fetch(base).then((r) => r.json()),
      fetch(`${base}/tasks`).then((r) => r.json()),
      fetch(`${base}/deadlines`).then((r) => r.json()),
      fetch(`${base}/compliance`).then((r) => r.json()),
      fetch(`${base}/dscs`).then((r) => r.json()),
      fetch(`${base}/licenses`).then((r) => r.json()),
      fetch(`${base}/notices`).then((r) => r.json()),
      fetch(`${base}/documents`).then((r) => r.json()),
    ]).then(([clientRes, tasksRes, deadlinesRes, complianceRes, dscsRes, licensesRes, noticesRes, docsRes]) => {
      if (clientRes.success) setClient(clientRes.data)
      if (tasksRes.success) setTasks(tasksRes.data ?? [])
      if (deadlinesRes.success) setDeadlines(deadlinesRes.data ?? [])
      if (complianceRes.success) setCompliance(complianceRes.data ?? [])
      if (dscsRes.success) setDscs(dscsRes.data ?? [])
      if (licensesRes.success) setLicenses(licensesRes.data ?? [])
      if (noticesRes.success) setNotices(noticesRes.data ?? [])
      if (docsRes.success) setDocuments(docsRes.data ?? [])
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!client) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Client not found or access denied.</p>
          <Button variant="link" onClick={() => router.push('/portal/dashboard')}>Back to dashboard</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/portal/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{client.business_name}</h1>
          <p className="text-sm text-muted-foreground">
            {[client.business_entity, client.city, client.state].filter(Boolean).join(' — ')}
          </p>
        </div>
        <StatusBadge status={client.status} />
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Business Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm">
            {client.pan && <div><span className="text-muted-foreground">PAN:</span> {client.pan}</div>}
            {client.gstin && <div><span className="text-muted-foreground">GSTIN:</span> {client.gstin}</div>}
            {client.tan && <div><span className="text-muted-foreground">TAN:</span> {client.tan}</div>}
            {client.cin && <div><span className="text-muted-foreground">CIN:</span> {client.cin}</div>}
            {client.email && <div><span className="text-muted-foreground">Email:</span> {client.email}</div>}
            {client.mobile && <div><span className="text-muted-foreground">Mobile:</span> {client.mobile}</div>}
            {client.address && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Address:</span>{' '}
                {[client.address, client.city, client.state, client.pincode].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          {client.client_services?.length > 0 && (
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Services:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {client.client_services.map((cs) => (
                  <Badge key={cs.service_id} variant="outline">{cs.services?.name}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="tasks" className="gap-1.5"><CheckSquare className="h-3.5 w-3.5" />Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="deadlines" className="gap-1.5"><CalendarClock className="h-3.5 w-3.5" />Deadlines ({deadlines.length})</TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Compliance ({compliance.length})</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="dscs" className="gap-1.5"><KeySquare className="h-3.5 w-3.5" />DSCs ({dscs.length})</TabsTrigger>
          <TabsTrigger value="licenses" className="gap-1.5"><Scale className="h-3.5 w-3.5" />Licenses ({licenses.length})</TabsTrigger>
          <TabsTrigger value="notices" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Notices ({notices.length})</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No tasks found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.task_name}</TableCell>
                        <TableCell>{t.services?.name ?? '—'}</TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                        <TableCell><Badge variant="outline">{t.priority}</Badge></TableCell>
                        <TableCell>{formatDate(t.due_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines">
          <Card>
            <CardContent className="p-0">
              {deadlines.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No deadlines found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Data Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deadlines.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.period_label}</TableCell>
                        <TableCell>{d.services?.name ?? '—'}</TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                        <TableCell>{formatDate(d.due_date)}</TableCell>
                        <TableCell>{d.data_received ? 'Yes' : 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardContent className="p-0">
              {compliance.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No compliance entries found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Form</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Filed Date</TableHead>
                      <TableHead>Ack No.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compliance.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.compliance_type}</TableCell>
                        <TableCell>{c.form_name ?? '—'}</TableCell>
                        <TableCell>{c.period ?? '—'}</TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell>{formatDate(c.due_date)}</TableCell>
                        <TableCell>{formatDate(c.filed_date)}</TableCell>
                        <TableCell>{c.acknowledgement_no ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="p-0">
              {documents.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No documents found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Returned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.document_name ?? '—'}</TableCell>
                        <TableCell>{d.person ?? '—'}</TableCell>
                        <TableCell><Badge variant="outline">{d.direction}</Badge></TableCell>
                        <TableCell>{formatDate(d.date)}</TableCell>
                        <TableCell>{formatDate(d.returned_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DSCs Tab */}
        <TabsContent value="dscs">
          <Card>
            <CardContent className="p-0">
              {dscs.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No digital signature certificates found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holder</TableHead>
                      <TableHead>PAN</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dscs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.holder_name}</TableCell>
                        <TableCell>{d.pan ?? '—'}</TableCell>
                        <TableCell>{d.class ?? '—'}</TableCell>
                        <TableCell>{d.vendor ?? '—'}</TableCell>
                        <TableCell>{formatDate(d.issued_date)}</TableCell>
                        <TableCell>{formatDate(d.expiry_date)}</TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licenses Tab */}
        <TabsContent value="licenses">
          <Card>
            <CardContent className="p-0">
              {licenses.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No licenses found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reg. No.</TableHead>
                      <TableHead>Authority</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.license_name ?? '—'}</TableCell>
                        <TableCell>{l.license_type ?? '—'}</TableCell>
                        <TableCell>{l.registration_no ?? '—'}</TableCell>
                        <TableCell>{l.issuing_authority ?? '—'}</TableCell>
                        <TableCell>{formatDate(l.issued_date)}</TableCell>
                        <TableCell>{formatDate(l.expiry_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notices Tab */}
        <TabsContent value="notices">
          <Card>
            <CardContent className="p-0">
              {notices.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No notices found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>AY</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notices.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-medium">{n.notice_types?.name ?? '—'}</TableCell>
                        <TableCell>{n.section ?? '—'}</TableCell>
                        <TableCell>{n.assessment_year ?? '—'}</TableCell>
                        <TableCell>{formatDate(n.date_of_issue)}</TableCell>
                        <TableCell>{formatDate(n.due_date)}</TableCell>
                        <TableCell><StatusBadge status={n.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
