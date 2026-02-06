import { z } from 'zod'

export const createBundleSchema = z.object({
  name: z.string().min(1, 'Bundle name is required'),
  description: z.string().optional(),
  bundle_price: z.number().min(0).default(0),
  service_ids: z.array(z.string().uuid()).min(1, 'At least one service required'),
})
export const updateBundleSchema = createBundleSchema.partial()
export const assignBundleSchema = z.object({
  bundle_id: z.string().uuid(),
  agreed_price: z.number().min(0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})
export type CreateBundleInput = z.input<typeof createBundleSchema>
export type UpdateBundleInput = z.input<typeof updateBundleSchema>
export type AssignBundleInput = z.input<typeof assignBundleSchema>
