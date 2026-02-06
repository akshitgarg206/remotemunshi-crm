import { NextRequest } from 'next/server'
import { CSV_TEMPLATES } from '@/lib/import/templates'
import { generateCsvTemplate } from '@/lib/import/template-generator'

// GET /api/v1/import/[module]/template — Download CSV template
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { module } = await params

  if (!CSV_TEMPLATES[module]) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_MODULE',
          message: `Unknown module: ${module}. Valid modules: ${Object.keys(CSV_TEMPLATES).join(', ')}`,
        },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const csv = generateCsvTemplate(module)

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${module}-template.csv"`,
    },
  })
}
