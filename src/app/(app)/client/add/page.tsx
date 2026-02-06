'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClientSchema, type CreateClientInput } from '@/lib/validators/clients'
import { useCreateClient } from '@/hooks/queries/use-clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { BUSINESS_ENTITY_TYPE } from '@/types/enums'

export default function AddClientPage() {
  const router = useRouter()
  const createClient = useCreateClient()

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { status: 'active' },
  })

  const onSubmit = async (data: CreateClientInput) => {
    try {
      await createClient.mutateAsync(data)
      toast.success('Client created successfully')
      router.push('/client')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create client')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Client</h1>
        <p className="text-muted-foreground">Create a new client record</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input id="business_name" {...register('business_name')} />
              {errors.business_name && <p className="text-sm text-red-500">{errors.business_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Person</Label>
              <Input id="contact_name" {...register('contact_name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" {...register('mobile')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_entity">Entity Type</Label>
              <Select onValueChange={(v) => setValue('business_entity', v as CreateClientInput['business_entity'])}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_ENTITY_TYPE.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue="active" onValueChange={(v) => setValue('status', v as CreateClientInput['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tax Info */}
        <Card>
          <CardHeader><CardTitle>Tax & Registration</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input id="gstin" {...register('gstin')} placeholder="22AAAAA0000A1Z5" />
              {errors.gstin && <p className="text-sm text-red-500">{errors.gstin.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input id="pan" {...register('pan')} placeholder="AAAAA0000A" />
              {errors.pan && <p className="text-sm text-red-500">{errors.pan.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tan">TAN</Label>
              <Input id="tan" {...register('tan')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cin">CIN</Label>
              <Input id="cin" {...register('cin')} />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register('address')} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register('state')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" {...register('pincode')} />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea {...register('notes')} placeholder="Any additional notes..." rows={3} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Client'}
          </Button>
        </div>
      </form>
    </div>
  )
}
