import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type PortalHandlerFn = (
  req: NextRequest,
  context: {
    params: Record<string, string>
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
    userId: string
    contactId: string
    clientIds: string[]
  }
) => Promise<NextResponse>

/**
 * API handler for portal routes. Authenticates via Supabase session,
 * resolves the contact (not employee), and scopes to linked client IDs.
 * All portal routes are read-only by design.
 */
export function portalHandler(handler: PortalHandlerFn) {
  return async (req: NextRequest, routeContext: { params: Promise<Record<string, string>> }) => {
    try {
      const supabase = await createServerSupabaseClient()

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        )
      }

      // Resolve contact from auth user
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, portal_enabled')
        .eq('auth_user_id', user.id)
        .single()

      if (!contact || !contact.portal_enabled) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Portal access not enabled for this account' } },
          { status: 403 }
        )
      }

      // Get all client IDs this contact is linked to
      const { data: links } = await supabase
        .from('client_contacts')
        .select('client_id')
        .eq('contact_id', contact.id)

      const clientIds = (links ?? []).map((l) => l.client_id)

      const params = await routeContext.params
      return await handler(req, { params, supabase, userId: user.id, contactId: contact.id, clientIds })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.issues },
          },
          { status: 400 }
        )
      }

      console.error('Portal API Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'An unexpected error occurred' },
        },
        { status: 500 }
      )
    }
  }
}
