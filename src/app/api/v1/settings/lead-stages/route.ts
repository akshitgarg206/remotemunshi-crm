import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase }) => {
  const { data, error } = await supabase
    .from('lead_stages')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'settings', action: 'read' } })

export const POST = apiHandler(async (req, { supabase }) => {
  const body = await req.json()
  const { name, color, sort_order, is_active } = body

  if (!name?.trim()) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('lead_stages')
    .insert({
      name: name.trim(),
      color: color || '#6B7280',
      sort_order: sort_order ?? 0,
      is_active: is_active ?? true,
    })
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'settings', action: 'create' } })
