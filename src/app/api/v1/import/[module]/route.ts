import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { CSV_TEMPLATES } from '@/lib/import/templates'
import { parseCsvContent, type ImportResult } from '@/lib/import/csv-importer'

// POST /api/v1/import/[module] — Import CSV data
export const POST = apiHandler(async (req, { params, supabase }) => {
  const module = params.module

  // Validate module
  const template = CSV_TEMPLATES[module]
  if (!template) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_MODULE',
          message: `Unknown module: ${module}. Valid modules: ${Object.keys(CSV_TEMPLATES).join(', ')}`,
        },
      },
      { status: 400 }
    )
  }

  // Read file from form data
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NO_FILE', message: 'No CSV file provided' },
      },
      { status: 400 }
    )
  }

  const csvContent = await file.text()
  const validateOnly = req.nextUrl.searchParams.get('validate') === 'true'

  // Parse and validate
  const { rows, errors } = parseCsvContent(csvContent, module)

  const result: ImportResult = {
    total: rows.length + errors.length,
    success: rows.length,
    failed: errors.length,
    errors,
  }

  // If validate-only, return validation results without inserting
  if (validateOnly) {
    return NextResponse.json({ success: true, data: result })
  }

  // Batch insert valid rows
  if (rows.length > 0) {
    const { error: insertError } = await supabase.from(template.table).insert(rows)

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSERT_ERROR',
            message: insertError.message,
          },
          data: result,
        },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: true, data: result }, { status: 201 })
})
