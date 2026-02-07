import { z } from 'zod'

const taskTemplateBaseSchema = z.object({
  task_name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  service_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  trigger_type: z.enum(['recurring', 'onboarding']).default('recurring'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly']).optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  day_of_week: z.number().int().min(0).max(6).optional(),
  month_of_year: z.number().int().min(1).max(12).optional(),
  estimated_hours: z.number().min(0).optional(),
  checklist_template: z.array(z.object({
    title: z.string().min(1),
    sort_order: z.number().default(0),
  })).default([]),
  assignee_ids: z.array(z.string().uuid()).optional(),
  reviewer_1_id: z.string().uuid().nullable().optional(),
  reviewer_2_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
})

export const createTaskTemplateSchema = taskTemplateBaseSchema.superRefine((data, ctx) => {
  if (data.trigger_type === 'recurring' && !data.frequency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Frequency is required for recurring templates',
      path: ['frequency'],
    })
  }
})

export const updateTaskTemplateSchema = taskTemplateBaseSchema.partial()

export const generateFromTemplateSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
})

export type CreateTaskTemplateInput = z.input<typeof createTaskTemplateSchema>
export type UpdateTaskTemplateInput = z.infer<typeof updateTaskTemplateSchema>
export type GenerateFromTemplateInput = z.infer<typeof generateFromTemplateSchema>
