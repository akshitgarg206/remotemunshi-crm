import Papa from 'papaparse'
import { CSV_TEMPLATES } from './templates'

export interface ImportError {
  row: number
  field: string
  message: string
}

export interface ImportResult {
  total: number
  success: number
  failed: number
  errors: ImportError[]
}

export function parseCsvContent(
  csvContent: string,
  module: string
): { rows: Record<string, string>[]; errors: ImportError[] } {
  const template = CSV_TEMPLATES[module]
  if (!template) throw new Error(`Unknown module: ${module}`)

  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  })

  const errors: ImportError[] = []
  const rows: Record<string, string>[] = []

  parsed.data.forEach((rawRow: any, idx: number) => {
    const row: Record<string, string> = {}
    let hasError = false

    template.columns.forEach((col) => {
      const value = rawRow[col.header]?.trim() || ''

      if (col.required && !value) {
        errors.push({
          row: idx + 2,
          field: col.header,
          message: `${col.header} is required`,
        })
        hasError = true
      }

      if (value && col.type === 'email' && !value.includes('@')) {
        errors.push({
          row: idx + 2,
          field: col.header,
          message: `Invalid email`,
        })
        hasError = true
      }

      if (value && col.type === 'number' && isNaN(Number(value))) {
        errors.push({
          row: idx + 2,
          field: col.header,
          message: `Must be a number`,
        })
        hasError = true
      }

      // Enum validation
      if (value && col.enum && !col.enum.includes(value)) {
        errors.push({
          row: idx + 2,
          field: col.header,
          message: `Invalid value "${value}". Must be one of: ${col.enum.join(', ')}`,
        })
        hasError = true
      }

      // Lookup fields store the raw value for now — resolved in the import route
      if (value) {
        if (col.lookup === 'client_id') {
          row[col.field] = value // Stored as business_name, resolved to UUID in import route
        } else {
          row[col.field] = col.type === 'number' ? String(Number(value)) : value
        }
      }
    })

    if (!hasError) rows.push(row)
  })

  return { rows, errors }
}
