import type { SupabaseClient } from '@supabase/supabase-js'

interface LogActivityParams {
  employeeId: string | null
  action: string
  entityType: string
  entityId: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  description?: string
}

export async function logActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
) {
  const { employeeId, action, entityType, entityId, oldValues, newValues, description } = params

  try {
    await supabase.from('activity_log').insert({
      employee_id: employeeId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues || null,
      new_values: newValues || null,
      description: description || `${action} ${entityType}`,
    })
  } catch (err) {
    // Activity logging should never block the main operation
    console.error('Failed to log activity:', err)
  }
}
