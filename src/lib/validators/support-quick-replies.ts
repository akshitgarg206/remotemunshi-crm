import { z } from 'zod'

export const createQuickReplySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
  shortcut: z.string().optional(),
  channel: z.enum(['whatsapp', 'email', 'phone', 'in_person', 'sms']).optional(),
  is_global: z.boolean().default(true),
})

export const updateQuickReplySchema = createQuickReplySchema.partial()

export type CreateQuickReplyInput = z.input<typeof createQuickReplySchema>
export type UpdateQuickReplyInput = z.input<typeof updateQuickReplySchema>
