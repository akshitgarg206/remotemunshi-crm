'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useConversationCounts() {
  return useQuery({
    queryKey: ['conversation-counts'],
    queryFn: () => apiFetch<Record<string, number>>('/api/v1/support/conversations/counts'),
    refetchInterval: 30000, // Refresh every 30s
  })
}
