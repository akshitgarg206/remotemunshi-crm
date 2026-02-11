import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const GET = apiHandler(async (req, { params, supabase }) => {
  const serviceId = params.id

  const [clientsRes, tasksRes, templatesRes, bundlesRes] = await Promise.all([
    supabase
      .from('client_services')
      .select('service_id, clients(id, name, code, is_active)')
      .eq('service_id', serviceId)
      .eq('is_active', true),
    supabase
      .from('tasks')
      .select('id, title, status, priority, created_at, clients(id, name)')
      .eq('service_id', serviceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('recurring_tasks')
      .select('id, task_name, frequency, is_active, created_at')
      .eq('service_id', serviceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('service_bundle_items')
      .select('service_id, service_bundles!inner(id, name, is_active)')
      .eq('service_id', serviceId)
      .is('service_bundles.deleted_at' as any, null),
  ])

  return NextResponse.json({
    success: true,
    data: {
      clients: (clientsRes.data || []).map((r: any) => r.clients).filter(Boolean),
      tasks: tasksRes.data || [],
      templates: templatesRes.data || [],
      bundles: (bundlesRes.data || []).map((r: any) => r.service_bundles).filter(Boolean),
    },
  })
}, { requirePermission: { module: 'services', action: 'read' } })
