import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { discoverPhoneNumbers } from '@/lib/whatsapp/client'

/**
 * GET — Check ChakraHQ connection status and discover phone numbers
 */
export const GET = apiHandler(async () => {
  const pluginId = process.env.CHAKRA_PLUGIN_ID
  const hasToken = !!process.env.CHAKRA_ACCESS_TOKEN

  if (!pluginId || !hasToken) {
    return NextResponse.json({
      success: true,
      data: {
        connected: false,
        pluginId: null,
        phoneNumbers: [],
        message: 'ChakraHQ not configured. Set CHAKRA_PLUGIN_ID and CHAKRA_ACCESS_TOKEN env vars.',
      },
    })
  }

  try {
    const result = await discoverPhoneNumbers()
    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        pluginId: result.pluginId,
        phoneNumbers: result.phoneNumbers,
      },
    })
  } catch (err) {
    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        pluginId,
        phoneNumbers: [],
        message: 'Connected but could not auto-discover phone numbers. Add them manually.',
      },
    })
  }
}, { requirePermission: { module: 'settings', action: 'read' } })
