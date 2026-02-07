import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { z } from 'zod'

const aiReplySchema = z.object({
  conversation_id: z.string().uuid(),
  instruction: z.string().optional(),
})

export const POST = apiHandler(async (req, { supabase }) => {
  const body = await req.json()
  const { conversation_id, instruction } = aiReplySchema.parse(body)

  // Fetch recent messages for context
  const { data: messages, error: msgErr } = await supabase
    .from('support_messages')
    .select('content, direction, is_internal, created_at')
    .eq('conversation_id', conversation_id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true })
    .limit(20)

  if (msgErr) throw msgErr

  // Fetch conversation + client context
  const { data: conv, error: convErr } = await supabase
    .from('support_conversations')
    .select(`
      subject, channel,
      client:clients(business_name, contact_name),
      contact:contacts(name)
    `)
    .eq('id', conversation_id)
    .single()

  if (convErr) throw convErr

  // Supabase returns embedded relations as arrays
  const client = Array.isArray(conv?.client) ? conv.client[0] : conv?.client
  const contact = Array.isArray(conv?.contact) ? conv.contact[0] : conv?.contact
  const clientName = client?.business_name || contact?.name || 'Customer'
  const messageHistory = (messages || []).map(m =>
    `${m.direction === 'inbound' ? clientName : 'Agent'}: ${m.content}`
  ).join('\n')

  const systemPrompt = `You are a helpful customer support assistant for a professional services firm. Generate a polite, professional reply to the customer's last message. Be concise but thorough. ${instruction ? `Additional instruction: ${instruction}` : ''}`

  const userPrompt = `Conversation with ${clientName} via ${conv?.channel || 'chat'}:\n\n${messageHistory}\n\nGenerate a reply from the agent:`

  // Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFIG_ERROR', message: 'AI service not configured' } },
      { status: 503 }
    )
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    console.error('Claude API error:', errBody)
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: 'Failed to generate reply' } },
      { status: 502 }
    )
  }

  const result = await response.json()
  const generatedReply = result.content?.[0]?.text || ''

  return NextResponse.json({
    success: true,
    data: { reply: generatedReply },
  })
}, { requirePermission: { module: 'communications', action: 'read' } })
