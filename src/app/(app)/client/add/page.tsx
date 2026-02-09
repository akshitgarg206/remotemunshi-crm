'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { createClientSchema, type CreateClientInput } from '@/lib/validators/clients'
import { useCreateClient } from '@/hooks/queries/use-clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { BUSINESS_ENTITY_TYPE } from '@/types/enums'

const formSteps = [
  { label: 'Basic Info', key: 'basic' },
  { label: 'Tax Details', key: 'tax' },
  { label: 'Address', key: 'address' },
  { label: 'Notes', key: 'notes' },
]

export default function AddClientPage() {
  const router = useRouter()
  const createClient = useCreateClient()
  const [step, setStep] = useState(0)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, trigger } = useForm<CreateClientInput>({
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

  const nextStep = async () => {
    // Validate current step fields before proceeding
    const fieldsPerStep: (keyof CreateClientInput)[][] = [
      ['business_name', 'contact_name', 'email', 'mobile', 'business_entity', 'status'],
      ['gstin', 'pan', 'tan', 'cin'],
      ['address', 'city', 'state', 'pincode'],
      ['notes'],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid && step < formSteps.length - 1) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Client</h1>
        <p className="text-muted-foreground">Create a new client record</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {formSteps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i < step
                  ? 'bg-primary text-primary-foreground cursor-pointer'
                  : i === step
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span className={cn(
              'text-sm hidden sm:inline',
              i === step ? 'font-medium' : 'text-muted-foreground'
            )}>
              {s.label}
            </span>
            {i < formSteps.length - 1 && (
              <div className={cn('h-px w-8 lg:w-12', i < step ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Basic Info */}
        {step === 0 && (
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
                      <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</SelectItem>
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
        )}

        {/* Step 2: Tax Info */}
        {step === 1 && (
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
        )}

        {/* Step 3: Address */}
        {step === 2 && (
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
        )}

        {/* Step 4: Notes */}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea {...register('notes')} placeholder="Any additional notes about this client..." rows={4} />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={step === 0 ? () => router.back() : prevStep}>
            {step === 0 ? 'Cancel' : 'Previous'}
          </Button>
          <div className="flex gap-3">
            {step < formSteps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Client'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
