import { z } from 'zod'

export const createEscalationSchema = z.object({
  ticket_id: z.string().uuid(),
  tier: z.enum(['tier_1', 'tier_2', 'tier_3']).default('tier_1'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  to_employee_id: z.string().uuid().optional(),
  to_department_id: z.string().uuid().optional(),
  reason: z.string().min(1, 'Reason is required'),
  internal_note: z.string().optional(),
  sla_due_at: z.string().datetime().optional(),
})

export const updateEscalationSchema = z.object({
  status: z.enum(['pending', 'acknowledged', 'in_progress', 'resolved', 'declined']).optional(),
  tier: z.enum(['tier_1', 'tier_2', 'tier_3']).optional(),
  to_employee_id: z.string().uuid().nullable().optional(),
  to_department_id: z.string().uuid().nullable().optional(),
  internal_note: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
})

export type CreateEscalationInput = z.input<typeof createEscalationSchema>
export type UpdateEscalationInput = z.input<typeof updateEscalationSchema>
