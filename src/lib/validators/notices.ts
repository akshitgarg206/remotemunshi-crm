import { z } from 'zod'

export const createNoticeSchema = z.object({
  client_id: z.string().uuid({ message: 'Client is required' }),
  notice_type_id: z.string().uuid().optional(),
  section: z.string().optional(),
  assessment_year: z.string().optional(),
  date_of_issue: z.string().optional(),
  date_of_receipt: z.string().optional(),
  due_date: z.string().optional(),
  response_date: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open'),
  remarks: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
})

export const updateNoticeSchema = createNoticeSchema.partial()

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>
