import { z } from 'zod'

export const generateDeadlinesSchema = z.object({
  service_id: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
})

export const updateDeadlineSchema = z.object({
  status: z.enum(['upcoming', 'data_pending', 'data_received', 'in_progress', 'filed', 'overdue']).optional(),
  data_received: z.boolean().optional(),
  notes: z.string().optional(),
  task_id: z.string().uuid().optional(),
})

export const sendReminderSchema = z.object({
  channel: z.enum(['whatsapp', 'email', 'phone', 'sms']).default('whatsapp'),
  message: z.string().optional(),
})

export type GenerateDeadlinesInput = z.infer<typeof generateDeadlinesSchema>
export type UpdateDeadlineInput = z.infer<typeof updateDeadlineSchema>
export type SendReminderInput = z.infer<typeof sendReminderSchema>
