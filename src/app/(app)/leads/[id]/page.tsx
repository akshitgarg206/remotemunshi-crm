'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { useUpdateLead, useDeleteLead, useConvertLead, useLeadStages } from '@/hooks/queries/use-leads'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LeadActivityTimeline } from '@/components/leads/lead-activity-timeline'
import { LeadCommunicationTimeline } from '@/components/leads/lead-communication-timeline'
import { LogLeadCommunicationDialog } from '@/components/leads/log-lead-communication-dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  ArrowLeft, UserCheck, Trash2, Pencil, Phone, Mail, Globe,
  User, Calendar, StickyNote, Briefcase, Thermometer, Target,
  DollarSign, Clock, MapPin, Plus,
} from 'lucide-react'
import { LEAD_SOURCE, BUSINESS_ENTITY_TYPE, LEAD_TEMPERATURE } from '@/types/enums'

interface LeadStage { id: string; name: string; color: string }
interface LeadService { service_id: string; services: { id: string; name: string } }
interface LeadAssignee { employee_id: string; employees: { id: string; name: string; email?: string } }
interface Lead {
  id: string
  business_name: string
  contact_person: string | null
  contact_no: string | null
  email: string | null
  source: string
  stage_id: string | null
  referred_by: string | null
  business_entity: string | null
  address: string | null
  city: string | null
  state: string | null
  notes: string | null
  score: number | null
  temperature: string | null
  deal_value: number | null
  expected_close_date: string | null
  next_follow_up: string | null
  follow_up_notes: string | null
  external_source: string | null
  converted_client_id: string | null
  created_at: string
  lead_stages: LeadStage | null
  lead_services: LeadService[]
  lead_assignees: LeadAssignee[]
}

const temperatureConfig: Record<string, { label: string; color: string; bg: string }> = {
  hot: { label: '🔥 Hot', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  warm: { label: '☀️ Warm', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  cold: { label: '❄️ Cold', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const leadId = id as string
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [commDialogOpen, setCommDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['leads', leadId],
    queryFn: () => apiFetch<Lead>(`/api/v1/leads/${leadId}`),
  })

  const updateLead = useUpdateLead(leadId)
  const deleteLead = useDeleteLead()
  const convertLead = useConvertLead()

  const lead = data?.data as Lead | undefined

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4"><Skeleton className="h-10 w-10" /><Skeleton className="h-8 w-64" /></div>
        <div className="grid gap-6 md:grid-cols-3"><Skeleton className="h-64 md:col-span-2" /><Skeleton className="h-64" /></div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Lead not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/leads')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads</Button>
      </div>
    )
  }

  const isConverted = !!lead.converted_client_id
  const temp = lead.temperature ? temperatureConfig[lead.temperature] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/leads')}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{lead.business_name}</h1>
              {lead.lead_stages && (
                <Badge style={{ backgroundColor: lead.lead_stages.color + '20', color: lead.lead_stages.color }}>
                  {lead.lead_stages.name}
                </Badge>
              )}
              {temp && (
                <Badge variant="secondary" className={temp.bg}>
                  <span className={temp.color}>{temp.label}</span>
                </Badge>
              )}
              {isConverted && <Badge variant="default" className="bg-green-600">Converted</Badge>}
            </div>
            <p className="text-muted-foreground">Lead Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isConverted && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button size="sm" onClick={() => {
                convertLead.mutate({ id: leadId }, {
                  onSuccess: () => { toast.success('Lead converted to client'); router.push('/client') },
                  onError: (err) => toast.error(err.message),
                })
              }} disabled={convertLead.isPending}>
                <UserCheck className="mr-1 h-4 w-4" /> {convertLead.isPending ? 'Converting...' : 'Convert'}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => {
                if (confirm('Delete this lead?')) {
                  deleteLead.mutate(leadId, {
                    onSuccess: () => { toast.success('Lead deleted'); router.push('/leads') },
                    onError: (err) => toast.error(err.message),
                  })
                }
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Info Card */}
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Lead Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoItem icon={User} label="Contact Person" value={lead.contact_person} />
                  <InfoItem icon={Phone} label="Phone" value={lead.contact_no} />
                  <InfoItem icon={Mail} label="Email" value={lead.email} />
                  <InfoItem icon={Globe} label="Source" value={lead.source?.replace(/_/g, ' ')} capitalize />
                  {lead.referred_by && <InfoItem icon={User} label="Referred By" value={lead.referred_by} />}
                  {lead.business_entity && <InfoItem icon={Briefcase} label="Business Entity" value={lead.business_entity?.replace(/_/g, ' ')} capitalize />}
                  {(lead.address || lead.city || lead.state) && (
                    <InfoItem icon={MapPin} label="Address" value={[lead.address, lead.city, lead.state].filter(Boolean).join(', ')} />
                  )}
                  <InfoItem icon={Calendar} label="Created" value={lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : null} />
                </div>
                {lead.notes && (
                  <>
                    <Separator />
                    <InfoItem icon={StickyNote} label="Notes" value={lead.notes} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Scoring Card */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> Scoring & Deal</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${lead.score || 0}%` }} />
                      </div>
                      <span className="text-sm font-medium">{lead.score ?? 0}</span>
                    </div>
                  </div>
                  {lead.deal_value != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Deal Value</span>
                      <span className="text-sm font-medium">₹{Number(lead.deal_value).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {lead.expected_close_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expected Close</span>
                      <span className="text-sm font-medium">{format(new Date(lead.expected_close_date), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Follow-up Card */}
              {(lead.next_follow_up || lead.follow_up_notes) && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Follow-up</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {lead.next_follow_up && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Next</span>
                        <Badge variant={new Date(lead.next_follow_up) <= new Date() ? 'destructive' : 'secondary'}>
                          {format(new Date(lead.next_follow_up), 'dd MMM yyyy')}
                        </Badge>
                      </div>
                    )}
                    {lead.follow_up_notes && <p className="text-sm text-muted-foreground">{lead.follow_up_notes}</p>}
                  </CardContent>
                </Card>
              )}

              {/* Services Card */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Services</CardTitle></CardHeader>
                <CardContent>
                  {lead.lead_services?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {lead.lead_services.map((ls) => (
                        <Badge key={ls.service_id} variant="outline">{ls.services?.name}</Badge>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No services listed</p>}
                </CardContent>
              </Card>

              {/* Assignees Card */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Assignees</CardTitle></CardHeader>
                <CardContent>
                  {lead.lead_assignees?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {lead.lead_assignees.map((la) => (
                        <Badge key={la.employee_id} variant="secondary">{la.employees?.name}</Badge>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No assignees</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <LeadActivityTimeline leadId={leadId} />
        </TabsContent>

        <TabsContent value="communications" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setCommDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Log Communication
            </Button>
          </div>
          <LeadCommunicationTimeline leadId={leadId} />
          <LogLeadCommunicationDialog leadId={leadId} open={commDialogOpen} onOpenChange={setCommDialogOpen} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <EditLeadDialog lead={lead} open={editOpen} onOpenChange={setEditOpen} onSave={async (data) => {
        await updateLead.mutateAsync(data)
        toast.success('Lead updated')
        setEditOpen(false)
      }} />
    </div>
  )
}

function InfoItem({ icon: Icon, label, value, capitalize }: { icon: typeof User; label: string; value: string | null | undefined; capitalize?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`font-medium ${capitalize ? 'capitalize' : ''}`}>{value || '-'}</p>
      </div>
    </div>
  )
}

function EditLeadDialog({ lead, open, onOpenChange, onSave }: {
  lead: Lead; open: boolean; onOpenChange: (v: boolean) => void
  onSave: (data: Record<string, unknown>) => Promise<void>
}) {
  const { data: stagesData } = useLeadStages()
  const stages = ((stagesData?.data as { id: string; name: string; color: string; is_active: boolean }[]) || []).filter(s => s.is_active)

  const [form, setForm] = useState(() => ({
    business_name: lead.business_name,
    contact_person: lead.contact_person || '',
    contact_no: lead.contact_no || '',
    email: lead.email || '',
    source: lead.source || 'other',
    stage_id: lead.stage_id || '',
    referred_by: lead.referred_by || '',
    business_entity: lead.business_entity || '',
    address: lead.address || '',
    city: lead.city || '',
    state: lead.state || '',
    notes: lead.notes || '',
    score: lead.score ?? 50,
    temperature: lead.temperature || '',
    deal_value: lead.deal_value ?? '',
    expected_close_date: lead.expected_close_date || '',
    next_follow_up: lead.next_follow_up || '',
    follow_up_notes: lead.follow_up_notes || '',
  }))
  const [saving, setSaving] = useState(false)

  // Reset form when lead changes
  const handleOpen = (v: boolean) => {
    if (v) {
      setForm({
        business_name: lead.business_name,
        contact_person: lead.contact_person || '',
        contact_no: lead.contact_no || '',
        email: lead.email || '',
        source: lead.source || 'other',
        stage_id: lead.stage_id || '',
        referred_by: lead.referred_by || '',
        business_entity: lead.business_entity || '',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        notes: lead.notes || '',
        score: lead.score ?? 50,
        temperature: lead.temperature || '',
        deal_value: lead.deal_value ?? '',
        expected_close_date: lead.expected_close_date || '',
        next_follow_up: lead.next_follow_up || '',
        follow_up_notes: lead.follow_up_notes || '',
      })
    }
    onOpenChange(v)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { ...form }
      if (payload.stage_id === '') delete payload.stage_id
      if (payload.business_entity === '') delete payload.business_entity
      if (payload.temperature === '') delete payload.temperature
      if (payload.deal_value === '') delete payload.deal_value
      else payload.deal_value = Number(payload.deal_value)
      if (payload.expected_close_date === '') delete payload.expected_close_date
      if (payload.next_follow_up === '') delete payload.next_follow_up
      await onSave(payload)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Lead</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.contact_no} onChange={(e) => setForm({ ...form, contact_no: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={form.stage_id} onValueChange={(v) => setForm({ ...form, stage_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Select value={form.temperature} onValueChange={(v) => setForm({ ...form, temperature: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {LEAD_TEMPERATURE.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Score</Label>
                <span className="text-sm text-muted-foreground">{form.score}</span>
              </div>
              <Slider value={[form.score]} onValueChange={([v]) => setForm({ ...form, score: v })} min={0} max={100} step={5} />
            </div>
            <div className="space-y-2">
              <Label>Deal Value (₹)</Label>
              <Input type="number" min={0} step={0.01} value={form.deal_value} onChange={(e) => setForm({ ...form, deal_value: e.target.value ? Number(e.target.value) : '' })} />
            </div>
            <div className="space-y-2">
              <Label>Expected Close</Label>
              <Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Next Follow-up</Label>
              <Input type="date" value={form.next_follow_up} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Referred By</Label>
              <Input value={form.referred_by} onChange={(e) => setForm({ ...form, referred_by: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Follow-up Notes</Label>
            <Textarea value={form.follow_up_notes} onChange={(e) => setForm({ ...form, follow_up_notes: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
