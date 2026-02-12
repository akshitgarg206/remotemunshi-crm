import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { discoverPhoneNumbers } from '@/lib/whatsapp/client'

/**
 * GET — Check connection status for all WhatsApp providers
 */
export const GET = apiHandler(async () => {
  // ChakraHQ status
  const chakraPluginId = process.env.CHAKRA_PLUGIN_ID
  const hasChakraToken = !!process.env.CHAKRA_ACCESS_TOKEN
  const chakraConnected = !!(chakraPluginId && hasChakraToken)

  let chakraPhoneNumbers: { phoneNumberId: string; displayNumber: string; verifiedName: string }[] = []
  if (chakraConnected) {
    try {
      const result = await discoverPhoneNumbers()
      chakraPhoneNumbers = result.phoneNumbers
    } catch {
      // Connected but discovery failed — that's ok
    }
  }

  // YCloud status
  const hasYCloudKey = !!process.env.YCLOUD_API_KEY
  const ycloudConnected = hasYCloudKey

  return NextResponse.json({
    success: true,
    data: {
      // Legacy fields for backward compat
      connected: chakraConnected || ycloudConnected,
      pluginId: chakraPluginId || null,
      phoneNumbers: chakraPhoneNumbers,
      // Per-provider status
      providers: {
        chakrahq: {
          connected: chakraConnected,
          pluginId: chakraPluginId || null,
          phoneNumbers: chakraPhoneNumbers,
        },
        ycloud: {
          connected: ycloudConnected,
        },
      },
    },
  })
}, { requirePermission: { module: 'settings', action: 'read' } })
