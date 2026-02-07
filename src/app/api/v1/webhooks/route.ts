import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { z } from 'zod'
import crypto from 'crypto'

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1, 'At least one event required'),
  is_active: z.boolean().default(true),
})

const WEBHOOK_EVENTS = [
  'client.created', 'client.updated', 'client.deleted',
  'lead.created', 'lead.updated', 'lead.converted',
  'task.created', 'task.updated', 'task.status_changed', 'task.completed',
  'invoice.created', 'invoice.updated', 'invoice.paid',
  'payment.received',
  'compliance.overdue', 'compliance.filed',
  'dsc.expiring', 'dsc.expired',
  'license.expiring', 'license.expired',
  'employee.created',
]

export const GET = apiHandler(async (req, { supabase }) => {
  const { data, error } = await supabase
    .from('webhooks')
    .select('id, name, url, events, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return NextResponse.json({ success: true, data, meta: { available_events: WEBHOOK_EVENTS } })
}, { requirePermission: { module: 'webhooks', action: 'read' } })

export const POST = apiHandler(async (req, { supabase, userId }) => {
  const body = await req.json()
  const validated = createWebhookSchema.parse(body)

  // Generate signing secret
  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', userId)
    .single()

  const { data, error } = await supabase
    .from('webhooks')
    .insert({ ...validated, secret, created_by: employee?.id })
    .select('id, name, url, events, is_active, secret, created_at')
    .single()

  if (error) throw error

  // Return secret only on creation
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'webhooks', action: 'create' } })
