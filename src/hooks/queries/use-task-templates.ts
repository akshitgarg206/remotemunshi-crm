'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useTaskTemplates(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) searchParams.set(k, String(v)) })

  return useQuery({
    queryKey: ['task-templates', params],
    queryFn: () => apiFetch(`/api/v1/task-templates?${searchParams.toString()}`),
  })
}

export function useTaskTemplate(id: string) {
  return useQuery({
    queryKey: ['task-templates', id],
    queryFn: () => apiFetch(`/api/v1/task-templates/${id}`),
    enabled: !!id,
  })
}

export function useCreateTaskTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/task-templates', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-templates'] }),
  })
}

export function useUpdateTaskTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/task-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-templates'] })
      qc.invalidateQueries({ queryKey: ['task-templates', id] })
    },
  })
}

export function useDeleteTaskTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/v1/task-templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-templates'] }),
  })
}

export function useGenerateFromTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { month: number; year: number }) =>
      apiFetch(`/api/v1/task-templates/${id}/generate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-templates'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
