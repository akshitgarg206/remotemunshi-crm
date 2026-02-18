import { z } from 'zod'

export const createLeadCommunicationSchema = z.object({
  channel: z.enum(['whatsapp', 'email', 'phone', 'in_person', 'sms']),
  direction: z.enum(['inbound', 'outbound']).default('outbound'),
  subject: z.string().optional(),
  body: z.string().optional(),
  from_contact: z.string().optional(),
  to_contact: z.string().optional(),
  sent_at: z.string().optional(),
})

export const updateLeadCommunicationSchema = createLeadCommunicationSchema.partial()

export type CreateLeadCommunicationInput = z.input<typeof createLeadCommunicationSchema>
