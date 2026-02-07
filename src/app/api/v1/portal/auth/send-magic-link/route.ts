import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const schema = z.object({
  email: z.string().email(),
  rememberMe: z.boolean().optional().default(true),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, rememberMe } = schema.parse(body)

    const admin = createAdminClient()

    // Find contact with this email that has portal enabled
    const { data: contact } = await admin
      .from('contacts')
      .select('id, name, email, portal_enabled, auth_user_id')
      .eq('email', email)
      .eq('portal_enabled', true)
      .is('deleted_at', null)
      .single()

    if (!contact) {
      // Don't reveal whether email exists — always return success
      return NextResponse.json({
        success: true,
        data: { message: 'If an account exists with this email, a magic link has been sent.' },
      })
    }

    // Create Supabase auth user if contact doesn't have one yet
    if (!contact.auth_user_id) {
      const { data: authUser, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: 'portal_contact', contact_id: contact.id, name: contact.name },
      })

      if (createError) {
        // User might already exist in auth (e.g., was an employee) — try to find them
        const { data: { users } } = await admin.auth.admin.listUsers()
        const existingUser = users.find((u) => u.email === email)
        if (existingUser) {
          await admin
            .from('contacts')
            .update({ auth_user_id: existingUser.id })
            .eq('id', contact.id)
        } else {
          console.error('Failed to create portal auth user:', createError)
          return NextResponse.json(
            { success: false, error: { code: 'AUTH_ERROR', message: 'Failed to set up portal access' } },
            { status: 500 }
          )
        }
      } else {
        // Link auth user to contact
        await admin
          .from('contacts')
          .update({ auth_user_id: authUser.user.id })
          .eq('id', contact.id)
      }
    }

    // Build redirect URL with remember flag
    const origin = req.nextUrl.origin
    const redirectTo = `${origin}/portal/auth/callback${rememberMe ? '?remember=1' : ''}`

    // Send magic link via Supabase (uses the server client so cookies are set)
    const supabase = await createServerSupabaseClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    })

    if (otpError) {
      console.error('Magic link error:', otpError)
      return NextResponse.json(
        { success: false, error: { code: 'OTP_ERROR', message: 'Failed to send magic link' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'If an account exists with this email, a magic link has been sent.' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email', details: error.issues } },
        { status: 400 }
      )
    }
    console.error('Portal auth error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}
