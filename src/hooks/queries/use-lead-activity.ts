'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useLeadActivity(leadId: string) {
  return useQuery({
    queryKey: ['lead-activity', leadId],
    queryFn: () => apiFetch(`/api/v1/leads/${leadId}/activity`),
    enabled: !!leadId,
  })
}
