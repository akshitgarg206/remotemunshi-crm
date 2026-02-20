import { z } from 'zod'

export const createLeadSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  contact_person: z.string().optional(),
  contact_no: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  source: z.enum([
    'website', 'referral', 'social_media', 'cold_call', 'walk_in',
    'linkedin', 'reddit', 'outlook', 'whatsapp', 'email', 'meeting', 'other'
  ]).default('other'),
  stage_id: z.string().uuid().optional(),
  referred_by: z.string().optional(),
  business_entity: z.enum([
    'proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd',
    'opc', 'trust', 'society', 'huf', 'individual', 'other'
  ]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  assignee_ids: z.array(z.string().uuid()).optional(),
  bundle_ids: z.array(z.string().uuid()).optional(),
  temperature: z.enum(['hot', 'warm', 'cold']).optional(),
  expected_close_date: z.string().optional().transform(v => v === '' ? undefined : v),
  next_follow_up: z.string().optional().transform(v => v === '' ? undefined : v),
  follow_up_notes: z.string().optional(),
  external_source: z.string().optional(),
  external_id: z.string().optional(),
  external_metadata: z.record(z.string(), z.unknown()).optional(),
})

export const updateLeadSchema = createLeadSchema.partial()

export const convertLeadSchema = z.object({
  lead_id: z.string().uuid(),
  client_data: z.object({
    business_name: z.string().min(1),
    contact_name: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    business_entity: z.string().optional(),
    gstin: z.string().optional(),
    pan: z.string().optional(),
  }).optional(),
})

export type CreateLeadInput = z.input<typeof createLeadSchema>
export type UpdateLeadInput = z.input<typeof updateLeadSchema>
export type ConvertLeadInput = z.input<typeof convertLeadSchema>
