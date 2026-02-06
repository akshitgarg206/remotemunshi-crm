'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useClientTemplateOverrides(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'template-overrides'],
    queryFn: () => apiFetch(`/api/v1/clients/${clientId}/template-overrides`),
    enabled: !!clientId,
  })
}

export function useUpsertOverride(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { recurring_task_id: string; additional_steps?: { title: string; sort_order: number }[]; notes?: string }) =>
      apiFetch(`/api/v1/clients/${clientId}/template-overrides`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'template-overrides'] })
    },
  })
}

export function useDeleteOverride(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) =>
      apiFetch(`/api/v1/clients/${clientId}/template-overrides?template_id=${templateId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'template-overrides'] })
    },
  })
}
