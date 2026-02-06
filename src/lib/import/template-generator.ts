import { CSV_TEMPLATES } from './templates'

export function generateCsvTemplate(module: string): string {
  const template = CSV_TEMPLATES[module]
  if (!template) throw new Error(`Unknown module: ${module}`)

  const headers = template.columns.map((c) => c.header).join(',')
  const examples = template.columns.map((c) => `"${c.example}"`).join(',')

  return `${headers}\n${examples}`
}
