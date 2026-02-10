import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { exchangeCodeForToken, getPhoneNumberDetails } from '@/lib/whatsapp/client'

/**
 * Exchange the auth code from Embedded Signup for a permanent access token,
 * then fetch phone number details.
 */
export const POST = apiHandler(async (req) => {
  const body = await req.json()
  const { code, phone_number_id, waba_id } = body

  if (!code || !phone_number_id || !waba_id) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'code, phone_number_id, and waba_id are required' } },
      { status: 400 }
    )
  }

  // Exchange short-lived code for permanent token
  const tokenResult = await exchangeCodeForToken(code)

  // Fetch phone number details
  const phoneDetails = await getPhoneNumberDetails({
    phoneNumberId: phone_number_id,
    accessToken: tokenResult.access_token,
  })

  return NextResponse.json({
    success: true,
    data: {
      access_token: tokenResult.access_token,
      phone_number_id,
      waba_id,
      display_phone_number: phoneDetails.display_phone_number,
      business_name: phoneDetails.verified_name,
      quality_rating: phoneDetails.quality_rating,
    },
  })
}, { requirePermission: { module: 'settings', action: 'create' } })
