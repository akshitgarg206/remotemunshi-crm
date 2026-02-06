import { z } from 'zod'

export const createTicketSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  status: z.enum(['open', 'pending', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigned_employee_id: z.string().uuid().optional(),
  assigned_department_id: z.string().uuid().optional(),
  sla_due_at: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
})

export const updateTicketSchema = z.object({
  subject: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'pending', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_employee_id: z.string().uuid().nullable().optional(),
  assigned_department_id: z.string().uuid().nullable().optional(),
  sla_due_at: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
})

export type CreateTicketInput = z.input<typeof createTicketSchema>
export type UpdateTicketInput = z.input<typeof updateTicketSchema>
