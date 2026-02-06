import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

interface WebhookEvent {
  event: string
  data: Record<string, unknown>
  timestamp?: string
}

export async function dispatchWebhook(event: WebhookEvent) {
  const supabase = createAdminClient()

  // Get active webhooks that listen for this event
  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('is_active', true)
    .contains('events', [event.event])

  if (error || !webhooks?.length) return

  const payload = {
    event: event.event,
    data: event.data,
    timestamp: event.timestamp || new Date().toISOString(),
  }

  for (const webhook of webhooks) {
    // Create HMAC signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    // Log delivery attempt
    const { data: delivery } = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        event: event.event,
        payload,
        status: 'pending',
        attempt: 1,
      })
      .select()
      .single()

    // Send webhook (fire and forget with retry)
    sendWebhook(webhook.url, payload, signature, webhook.id, delivery?.id).catch(console.error)
  }
}

async function sendWebhook(
  url: string,
  payload: Record<string, unknown>,
  signature: string,
  webhookId: string,
  deliveryId?: string,
  attempt = 1
) {
  const maxAttempts = 3
  const supabase = createAdminClient()

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': payload.event as string,
        'User-Agent': 'RemoteMunshi-Webhook/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })

    if (deliveryId) {
      await supabase.from('webhook_deliveries').update({
        response_status: response.status,
        status: response.ok ? 'delivered' : 'failed',
        delivered_at: response.ok ? new Date().toISOString() : null,
        attempt,
      }).eq('id', deliveryId)
    }

    if (!response.ok && attempt < maxAttempts) {
      // Exponential backoff: 10s, 60s, 300s
      const delay = Math.pow(6, attempt) * 1000
      setTimeout(() => {
        sendWebhook(url, payload, signature, webhookId, deliveryId, attempt + 1)
      }, delay)
    }
  } catch (err) {
    if (deliveryId) {
      await supabase.from('webhook_deliveries').update({
        status: attempt >= maxAttempts ? 'failed' : 'pending',
        next_retry_at: attempt < maxAttempts
          ? new Date(Date.now() + Math.pow(6, attempt) * 1000).toISOString()
          : null,
        attempt,
      }).eq('id', deliveryId)
    }

    if (attempt < maxAttempts) {
      const delay = Math.pow(6, attempt) * 1000
      setTimeout(() => {
        sendWebhook(url, payload, signature, webhookId, deliveryId, attempt + 1)
      }, delay)
    }
  }
}
