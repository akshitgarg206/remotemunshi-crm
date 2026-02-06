'use client'

import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useGenerateReply() {
  return useMutation({
    mutationFn: ({ conversationId, instruction }: { conversationId: string; instruction?: string }) =>
      apiFetch('/api/v1/support/ai-reply', {
        method: 'POST',
        body: JSON.stringify({ conversation_id: conversationId, instruction }),
      }),
  })
}
