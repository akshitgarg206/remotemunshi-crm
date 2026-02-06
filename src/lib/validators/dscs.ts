import { z } from 'zod'

export const createDscSchema = z.object({
  client_id: z.string().uuid({ message: 'Client is required' }),
  holder_name: z.string().min(1, 'Holder name is required'),
  class: z.enum(['class_2', 'class_3']).default('class_3'),
  pan: z.string().optional(),
  issued_date: z.string().optional(),
  expiry_date: z.string().optional(),
  location: z.enum(['with_us', 'with_client', 'with_vendor', 'other']).default('with_us'),
  bin_number: z.string().optional(),
  vendor: z.string().optional(),
  token_number: z.string().optional(),
  status: z.enum(['active', 'expired', 'revoked', 'pending']).default('active'),
  remarks: z.string().optional(),
})

export const updateDscSchema = createDscSchema.partial()

export type CreateDscInput = z.infer<typeof createDscSchema>
export type UpdateDscInput = z.infer<typeof updateDscSchema>
