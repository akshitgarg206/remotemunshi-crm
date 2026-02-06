import { z } from 'zod'

export const createClientSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  contact_name: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  business_entity: z.enum([
    'proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd',
    'opc', 'trust', 'society', 'huf', 'individual', 'other'
  ]).optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
  tan: z.string().optional(),
  cin: z.string().optional(),
  udyam_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  state_code: z.string().optional(),
  pincode: z.string().optional(),
  gst_registration_date: z.string().optional(),
  gst_type: z.string().optional(),
  incorporation_date: z.string().optional(),
  auditor_id: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'on_hold', 'closed']).default('active'),
  portal_enabled: z.boolean().default(false),
  portal_email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  group_ids: z.array(z.string().uuid()).optional(),
  service_ids: z.array(z.string().uuid()).optional(),
  assignee_ids: z.array(z.string().uuid()).optional(),
})

export const updateClientSchema = createClientSchema.partial()

export type CreateClientInput = z.input<typeof createClientSchema>
export type CreateClientOutput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.input<typeof updateClientSchema>
