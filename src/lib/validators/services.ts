import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  category_id: z.string().uuid().optional(),
  sac_code: z.string().optional(),
  description: z.string().optional(),
  default_rate: z.number().min(0).default(0),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly']).optional(),
  due_day_of_month: z.number().min(1).max(31).optional(),
  reminder_days: z.array(z.number().min(1).max(31)).optional(),
  requires_data_collection: z.boolean().default(false),
  data_description: z.string().optional(),
  initial_message_template: z.string().optional(),
  reminder_message_template: z.string().optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
