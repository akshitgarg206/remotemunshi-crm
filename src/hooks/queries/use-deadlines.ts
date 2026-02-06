'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useDeadlines(params?: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) sp.set(k, String(v)) })
  return useQuery({
    queryKey: ['deadlines', params],
    queryFn: () => apiFetch(`/api/v1/deadlines?${sp.toString()}`),
  })
}

export function useDeadline(id: string) {
  return useQuery({
    queryKey: ['deadlines', id],
    queryFn: () => apiFetch(`/api/v1/deadlines/${id}`),
    enabled: !!id,
  })
}

export function useDeadlineKpi() {
  return useQuery({
    queryKey: ['deadlines', 'kpi'],
    queryFn: () => apiFetch('/api/v1/deadlines/kpi'),
  })
}

export function useGenerateDeadlines() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { service_id: string; month: number; year: number }) =>
      apiFetch('/api/v1/deadlines/generate', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deadlines'] })
    },
  })
}

export function useMarkDataReceived(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch(`/api/v1/deadlines/${id}/receive-data`, { method: 'POST', body: '{}' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deadlines'] })
      qc.invalidateQueries({ queryKey: ['deadlines', id] })
    },
  })
}

export function useSendReminder(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { channel?: string; message?: string }) =>
      apiFetch(`/api/v1/deadlines/${id}/send-reminder`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deadlines', id] })
    },
  })
}

export function useUpdateDeadline(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/deadlines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deadlines'] })
      qc.invalidateQueries({ queryKey: ['deadlines', id] })
    },
  })
}
