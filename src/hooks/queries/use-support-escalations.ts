'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useEscalations(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) searchParams.set(k, String(v)) })

  return useQuery({
    queryKey: ['support-escalations', params],
    queryFn: () => apiFetch(`/api/v1/support/escalations?${searchParams.toString()}`),
  })
}

export function useEscalation(id: string) {
  return useQuery({
    queryKey: ['support-escalations', id],
    queryFn: () => apiFetch(`/api/v1/support/escalations/${id}`),
    enabled: !!id,
  })
}

export function useCreateEscalation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/support/escalations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-escalations'] })
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })
}

export function useUpdateEscalation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/v1/support/escalations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['support-escalations'] })
      qc.invalidateQueries({ queryKey: ['support-escalations', id] })
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })
}
