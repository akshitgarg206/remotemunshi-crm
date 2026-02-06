'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useQuickReplies(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) searchParams.set(k, String(v)) })

  return useQuery({
    queryKey: ['support-quick-replies', params],
    queryFn: () => apiFetch(`/api/v1/support/quick-replies?${searchParams.toString()}`),
  })
}

export function useCreateQuickReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/support/quick-replies', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-quick-replies'] }),
  })
}

export function useUpdateQuickReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/v1/support/quick-replies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-quick-replies'] }),
  })
}

export function useDeleteQuickReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/support/quick-replies/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-quick-replies'] }),
  })
}
