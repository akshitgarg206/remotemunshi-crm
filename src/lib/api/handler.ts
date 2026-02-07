import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RequirePermission {
  module: string
  action: 'create' | 'read' | 'update' | 'delete' | 'export'
}

interface ApiHandlerOptions {
  requireAuth?: boolean
  requirePermission?: RequirePermission
}

type HandlerFn = (
  req: NextRequest,
  context: {
    params: Record<string, string>
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
    userId: string | null
    employeeId: string | null
  }
) => Promise<NextResponse>

export function apiHandler(handler: HandlerFn, options: ApiHandlerOptions = { requireAuth: true }) {
  return async (req: NextRequest, routeContext: { params: Promise<Record<string, string>> }) => {
    try {
      const supabase = await createServerSupabaseClient()
      let userId: string | null = null

      if (options.requireAuth !== false) {
        // Check for API key first
        const authHeader = req.headers.get('authorization')
        if (authHeader?.startsWith('Bearer rm_api_key_')) {
          // TODO: Validate API key from database
          userId = 'api-key-user'
        } else {
          const { data: { user }, error } = await supabase.auth.getUser()
          if (error || !user) {
            return NextResponse.json(
              { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
              { status: 401 }
            )
          }
          userId = user.id
        }
      }

      // Resolve employee ID from auth user ID (most tables FK to employees, not auth.users)
      let employeeId: string | null = null
      if (userId && userId !== 'api-key-user') {
        const { data: emp } = await supabase
          .from('employees')
          .select('id, role_id, is_admin')
          .eq('auth_user_id', userId)
          .single()
        employeeId = emp?.id || null

        // Permission check
        if (options.requirePermission && emp) {
          if (!emp.is_admin) {
            const { data: perm } = await supabase
              .from('role_permissions')
              .select('allowed, scope')
              .eq('role_id', emp.role_id)
              .eq('module', options.requirePermission.module)
              .eq('action', options.requirePermission.action)
              .single()

            if (!perm?.allowed) {
              return NextResponse.json(
                {
                  success: false,
                  error: {
                    code: 'FORBIDDEN',
                    message: `You don't have permission to ${options.requirePermission.action} ${options.requirePermission.module}`,
                  },
                },
                { status: 403 }
              )
            }
          }
          // Admins bypass permission checks
        }
      }

      const params = await routeContext.params
      return await handler(req, { params, supabase, userId, employeeId })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: error.issues,
            },
          },
          { status: 400 }
        )
      }

      console.error('API Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
          },
        },
        { status: 500 }
      )
    }
  }
}
