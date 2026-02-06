import { z } from 'zod'

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  notes: z.string().optional(),
  is_primary: z.boolean().default(false),
  client_ids: z.array(z.object({
    client_id: z.string().uuid(),
    role: z.string().optional(),
    is_primary: z.boolean().default(false),
  })).optional(),
})

export const updateContactSchema = createContactSchema.partial()

export const linkContactSchema = z.object({
  contact_id: z.string().uuid(),
  role: z.string().optional(),
  is_primary: z.boolean().default(false),
})

export type CreateContactInput = z.input<typeof createContactSchema>
export type UpdateContactInput = z.input<typeof updateContactSchema>
export type LinkContactInput = z.input<typeof linkContactSchema>
