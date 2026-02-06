'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createLeadSchema, type CreateLeadInput } from '@/lib/validators/leads'
import { useCreateLead } from '@/hooks/queries/use-leads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LEAD_SOURCE } from '@/types/enums'

export default function AddLeadPage() {
  const router = useRouter()
  const createLead = useCreateLead()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { source: 'other' },
  })

  const onSubmit = async (data: CreateLeadInput) => {
    try {
      await createLead.mutateAsync(data)
      toast.success('Lead created')
      router.push('/leads')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create lead')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Add Lead</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <Label>Referred By</Label>
              <Input {...register('referred_by')} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea {...register('notes')} rows={3} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Lead'}</Button>
        </div>
      </form>
    </div>
  )
}
