import { z } from 'zod'

export const createConversationSchema = z.object({
  client_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  channel: z.enum(['whatsapp', 'email', 'phone', 'in_person', 'sms']).default('whatsapp'),
  subject: z.string().optional(),
  assigned_employee_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const updateConversationSchema = z.object({
  status: z.enum(['open', 'waiting', 'resolved', 'closed', 'spam']).optional(),
  assigned_employee_id: z.string().uuid().nullable().optional(),
  subject: z.string().optional(),
  is_spam: z.boolean().optional(),
  sentiment_score: z.number().min(-1).max(1).optional(),
})

export type CreateConversationInput = z.input<typeof createConversationSchema>
export type UpdateConversationInput = z.input<typeof updateConversationSchema>
