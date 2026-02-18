'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createLeadSchema, type CreateLeadInput } from '@/lib/validators/leads'
import { useCreateLead, useLeadStages } from '@/hooks/queries/use-leads'
import { apiFetch } from '@/lib/api/fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { LEAD_SOURCE, BUSINESS_ENTITY_TYPE, LEAD_TEMPERATURE } from '@/types/enums'

interface Employee { id: string; name: string }
interface Bundle { id: string; name: string }
interface Stage { id: string; name: string; color: string; is_active: boolean }

export default function AddLeadPage() {
  const router = useRouter()
  const createLead = useCreateLead()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { source: 'other' },
  })

  const { data: stagesData } = useLeadStages()
  const stages = ((stagesData?.data as Stage[]) || []).filter(s => s.is_active)

  const { data: teamData } = useQuery({
    queryKey: ['team-for-leads'],
    queryFn: () => apiFetch('/api/v1/team?pageSize=500'),
  })
  const employees = ((teamData?.data as Employee[]) || [])

  const { data: bundlesData } = useQuery({
    queryKey: ['bundles-for-leads'],
    queryFn: () => apiFetch('/api/v1/bundles?pageSize=500'),
  })
  const bundles = ((bundlesData?.data as Bundle[]) || [])

  const selectedAssignees = watch('assignee_ids') || []
  const selectedBundles = watch('bundle_ids') || []
  const temperature = watch('temperature')

  const onSubmit = async (data: CreateLeadInput) => {
    try {
      await createLead.mutateAsync(data)
      toast.success('Lead created')
      router.push('/leads')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create lead')
    }
  }

  function toggleItem(field: 'assignee_ids' | 'bundle_ids', id: string) {
    const current = field === 'assignee_ids' ? selectedAssignees : selectedBundles
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    setValue(field, updated)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Add Lead</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Lead Information</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business Name *</Label>
                  <Input {...register('business_name')} />
                  {errors.business_name && <p className="text-sm text-red-500">{errors.business_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input {...register('contact_person')} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...register('contact_no')} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select defaultValue="other" onValueChange={(v) => setValue('source', v as CreateLeadInput['source'])}>
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
                  <Select onValueChange={(v) => setValue('stage_id', v)}>
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
                  <Label>Business Entity</Label>
                  <Select onValueChange={(v) => setValue('business_entity', v as CreateLeadInput['business_entity'])}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_ENTITY_TYPE.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Referred By</Label>
                  <Input {...register('referred_by')} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input {...register('address')} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input {...register('state')} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea {...register('notes')} rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Assignees */}
            <Card>
              <CardHeader><CardTitle>Assignees</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employees.map((emp) => (
                    <Badge
                      key={emp.id}
                      variant={selectedAssignees.includes(emp.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleItem('assignee_ids', emp.id)}
                    >
                      {emp.name}
                    </Badge>
                  ))}
                  {employees.length === 0 && <p className="text-sm text-muted-foreground">Loading team...</p>}
                </div>
              </CardContent>
            </Card>

            {/* Service Packages */}
            <Card>
              <CardHeader><CardTitle>Interested Service Packages</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {bundles.map((b) => (
                    <Badge
                      key={b.id}
                      variant={selectedBundles.includes(b.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleItem('bundle_ids', b.id)}
                    >
                      {b.name}
                    </Badge>
                  ))}
                  {bundles.length === 0 && <p className="text-sm text-muted-foreground">Loading service packages...</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Temperature & Pipeline */}
            <Card>
              <CardHeader><CardTitle>Temperature & Pipeline</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Temperature</Label>
                  <div className="flex gap-2">
                    {LEAD_TEMPERATURE.map((t) => (
                      <Button
                        key={t}
                        type="button"
                        variant={temperature === t ? 'default' : 'outline'}
                        size="sm"
                        className="capitalize"
                        onClick={() => setValue('temperature', temperature === t ? undefined : t)}
                      >
                        {t === 'hot' ? '🔥' : t === 'warm' ? '☀️' : '❄️'} {t}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expected Close Date</Label>
                  <Input type="date" {...register('expected_close_date')} />
                </div>
              </CardContent>
            </Card>

            {/* Follow-up */}
            <Card>
              <CardHeader><CardTitle>Follow-up</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Next Follow-up Date</Label>
                  <Input type="date" {...register('next_follow_up')} />
                </div>
                <div className="space-y-2">
                  <Label>Follow-up Notes</Label>
                  <Textarea {...register('follow_up_notes')} rows={3} placeholder="What to follow up on..." />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Lead'}</Button>
        </div>
      </form>
    </div>
  )
}
