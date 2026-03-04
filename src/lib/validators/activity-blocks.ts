import { z } from 'zod'
import { ACTIVITY_CATEGORY } from '@/types/enums'

export const createActivityBlockSchema = z.object({
  block_start: z.string().min(1, 'Block start is required'),
  block_end: z.string().min(1, 'Block end is required'),
  category: z.enum(ACTIVITY_CATEGORY),
  description: z.string().default(''),
  is_missed: z.boolean().default(false),
})

export const updateActivityBlockSchema = createActivityBlockSchema.partial()

export const createBatchActivityBlocksSchema = z.object({
  blocks: z.array(createActivityBlockSchema).min(1, 'At least one block is required'),
})

export type CreateActivityBlockInput = z.input<typeof createActivityBlockSchema>
export type UpdateActivityBlockInput = z.input<typeof updateActivityBlockSchema>
export type CreateBatchActivityBlocksInput = z.input<typeof createBatchActivityBlocksSchema>
