import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { CSV_TEMPLATES } from '@/lib/import/templates'
import { parseCsvContent, type ImportResult, type ImportError } from '@/lib/import/csv-importer'

// POST /api/v1/import/[module] — Import CSV data
export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
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

  // If validate-only, return validation results without inserting
  if (validateOnly) {
    const result: ImportResult = {
      total: rows.length + errors.length,
      success: rows.length,
      failed: errors.length,
      errors,
    }
    return NextResponse.json({ success: true, data: result })
  }

  // Resolve client_id lookups (business_name → UUID)
  const hasLookups = template.columns.some((col) => col.lookup === 'client_id')
  let clientMap: Record<string, string> = {}

  if (hasLookups && rows.length > 0) {
    const clientNames = [...new Set(rows.map((r) => r.client_id).filter(Boolean))]
    if (clientNames.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, business_name')
        .in('business_name', clientNames)
        .is('deleted_at', null)

      if (clients) {
        clients.forEach((c: { id: string; business_name: string }) => {
          clientMap[c.business_name.toLowerCase()] = c.id
        })
      }
    }
  }

  // Per-row insert
  const insertErrors: ImportError[] = [...errors]
  let successCount = 0

  for (let i = 0; i < rows.length; i++) {
    const row = { ...rows[i] }
    const csvRowNum = i + 2 + errors.filter((e) => e.row <= i + 2).length

    // Resolve client_id lookup
    if (hasLookups && row.client_id) {
      const clientId = clientMap[row.client_id.toLowerCase()]
      if (!clientId) {
        insertErrors.push({
          row: csvRowNum,
          field: 'Client Name',
          message: `Client "${row.client_id}" not found`,
        })
        continue
      }
      row.client_id = clientId
    }

    // Add created_by for tables that need it
    if (employeeId && ['clients', 'leads', 'tasks'].includes(module)) {
      row.created_by = employeeId
    }

    // Team import: create Supabase auth user first
    if (module === 'team') {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminClient = createAdminClient()

        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
          email: row.email,
          password: row.email.split('@')[0] + '123!', // Temporary password from email prefix
          email_confirm: true,
        })

        if (authError) {
          insertErrors.push({
            row: csvRowNum,
            field: 'Email',
            message: `Auth user creation failed: ${authError.message}`,
          })
          continue
        }

        row.auth_user_id = authUser.user.id
      } catch (err: any) {
        insertErrors.push({
          row: csvRowNum,
          field: 'Email',
          message: `Auth error: ${err.message}`,
        })
        continue
      }
    }

    // Insert row
    const { error: insertError } = await supabase.from(template.table).insert(row)

    if (insertError) {
      insertErrors.push({
        row: csvRowNum,
        field: '-',
        message: insertError.message,
      })
    } else {
      successCount++
    }
  }

  const result: ImportResult = {
    total: rows.length + errors.length,
    success: successCount,
    failed: insertErrors.length,
    errors: insertErrors,
  }

  return NextResponse.json({ success: true, data: result }, { status: 201 })
})
