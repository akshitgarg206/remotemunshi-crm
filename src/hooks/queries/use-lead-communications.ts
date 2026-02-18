'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useLeadCommunications(leadId: string, channel?: string | null) {
  const params = new URLSearchParams()
  if (channel) params.set('channel', channel)
  params.set('pageSize', '50')

  return useQuery({
    queryKey: ['lead-communications', leadId, channel],
    queryFn: () => apiFetch(`/api/v1/leads/${leadId}/communications?${params.toString()}`),
    enabled: !!leadId,
  })
}

export function useCreateLeadCommunication(leadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/leads/${leadId}/communications`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-communications', leadId] }),
  })
}
