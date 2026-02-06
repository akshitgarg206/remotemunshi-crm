import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { z } from 'zod'

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
})

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('webhooks')
    .select('id, name, url, events, is_active, created_at, updated_at')
    .eq('id', params.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Webhook not found' } }, { status: 404 })
    throw error
  }
  return NextResponse.json({ success: true, data })
})

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateWebhookSchema.parse(body)
  const { data, error } = await supabase
    .from('webhooks')
    .update(validated)
    .eq('id', params.id)
    .select('id, name, url, events, is_active, created_at, updated_at')
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
})

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase.from('webhooks').delete().eq('id', params.id)
  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
})
