import { z } from 'zod'

export const createComplianceEntrySchema = z.object({
  client_id: z.string().uuid({ message: 'Client is required' }),
  compliance_type: z.enum(['gst', 'income_tax', 'mca', 'tds', 'other']),
  form_id: z.string().uuid().optional(),
  form_name: z.string().min(1, 'Form name is required'),
  financial_year_id: z.string().uuid().optional(),
  period: z.string().optional(),
  due_date: z.string().optional(),
  filed_date: z.string().optional(),
  acknowledgement_no: z.string().optional(),
  reference_no: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'filed', 'not_applicable']).default('pending'),
  task_id: z.string().uuid().optional(),
  remarks: z.string().optional(),
})

export const updateComplianceEntrySchema = createComplianceEntrySchema.partial()

export type CreateComplianceEntryInput = z.infer<typeof createComplianceEntrySchema>
export type UpdateComplianceEntryInput = z.infer<typeof updateComplianceEntrySchema>
