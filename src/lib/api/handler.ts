import { NextRequest, NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ApiHandlerOptions {
  requireAuth?: boolean
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

      if (options.requireAuth) {
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
          .select('id')
          .eq('auth_user_id', userId)
          .single()
        employeeId = emp?.id || null
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
