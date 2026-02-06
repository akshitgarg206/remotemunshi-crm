import { z } from 'zod'

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  message_type: z.enum(['text', 'image', 'file', 'audio', 'video', 'system']).default('text'),
  direction: z.enum(['inbound', 'outbound']).default('outbound'),
  is_internal: z.boolean().default(false),
  channel: z.enum(['whatsapp', 'email', 'phone', 'in_person', 'sms']).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number().optional(),
  })).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateMessageInput = z.input<typeof createMessageSchema>
