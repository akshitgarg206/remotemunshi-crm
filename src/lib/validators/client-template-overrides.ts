import { z } from 'zod'

export const upsertOverrideSchema = z.object({
  recurring_task_id: z.string().uuid(),
  additional_steps: z.array(z.object({
    title: z.string().min(1),
    sort_order: z.number().default(0),
  })).default([]),
  notes: z.string().optional(),
})

export type UpsertOverrideInput = z.infer<typeof upsertOverrideSchema>
