import { z } from 'zod'

export const createLicenseSchema = z.object({
  client_id: z.string().uuid({ message: 'Client is required' }),
  license_name: z.string().min(1, 'License name is required'),
  license_type: z.string().optional(),
  registration_no: z.string().optional(),
  issued_date: z.string().optional(),
  expiry_date: z.string().optional(),
  issuing_authority: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  remarks: z.string().optional(),
})

export const updateLicenseSchema = createLicenseSchema.partial()

export type CreateLicenseInput = z.infer<typeof createLicenseSchema>
export type UpdateLicenseInput = z.infer<typeof updateLicenseSchema>
