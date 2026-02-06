'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useTickets(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) searchParams.set(k, String(v)) })

  return useQuery({
    queryKey: ['support-tickets', params],
    queryFn: () => apiFetch(`/api/v1/support/tickets?${searchParams.toString()}`),
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['support-tickets', id],
    queryFn: () => apiFetch(`/api/v1/support/tickets/${id}`),
    enabled: !!id,
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/support/tickets', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-tickets'] }),
  })
}

export function useUpdateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/v1/support/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
      qc.invalidateQueries({ queryKey: ['support-tickets', id] })
    },
  })
}

export function useTicketKpi() {
  return useQuery({
    queryKey: ['support-tickets', 'kpi'],
    queryFn: () => apiFetch('/api/v1/support/tickets/kpi'),
  })
}
