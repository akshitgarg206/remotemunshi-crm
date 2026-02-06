import { z } from 'zod'

export const createTaskSchema = z.object({
  task_name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  client_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'in_review', 'request_changes', 'completed', 'on_hold', 'cancelled']).default('pending'),
  sub_status_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional(),
  start_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  sprint_id: z.string().uuid().optional(),
  parent_task_id: z.string().uuid().optional(),
  reviewer_1_id: z.string().uuid().nullable().optional(),
  reviewer_2_id: z.string().uuid().nullable().optional(),
  assignee_ids: z.array(z.string().uuid()).optional(),
  checklist: z.array(z.object({
    title: z.string().min(1),
    sort_order: z.number().default(0),
  })).optional(),
})

export const updateTaskSchema = createTaskSchema.partial()

export const createTimeEntrySchema = z.object({
  task_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(0.25, 'Minimum 0.25 hours').max(24),
  description: z.string().optional(),
  billable: z.boolean().default(true),
})

export const createTaskCommentSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number().optional(),
  })).optional(),
})

export const reviewActionSchema = z.object({
  action: z.enum(['approve', 'request_changes']),
  comment: z.string().optional(),
})

export type CreateTaskInput = z.input<typeof createTaskSchema>
export type UpdateTaskInput = z.input<typeof updateTaskSchema>
export type CreateTimeEntryInput = z.input<typeof createTimeEntrySchema>
export type CreateTaskCommentInput = z.input<typeof createTaskCommentSchema>
export type ReviewActionInput = z.input<typeof reviewActionSchema>
