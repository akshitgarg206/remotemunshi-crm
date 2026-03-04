'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useActivityBlocks(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined) searchParams.set(k, String(v))
  })

  return useQuery({
    queryKey: ['activity-blocks', params],
    queryFn: () => apiFetch(`/api/v1/activity-blocks?${searchParams.toString()}`),
  })
}

export function useActivityBlockStats(date?: string) {
  const searchParams = new URLSearchParams()
  if (date) searchParams.set('date', date)

  return useQuery({
    queryKey: ['activity-blocks', 'stats', date],
    queryFn: () => apiFetch(`/api/v1/activity-blocks/stats?${searchParams.toString()}`),
  })
}

export function useActivitySuggestions(category?: string) {
  const searchParams = new URLSearchParams()
  if (category) searchParams.set('category', category)

  return useQuery({
    queryKey: ['activity-blocks', 'suggestions', category],
    queryFn: () => apiFetch(`/api/v1/activity-blocks/suggestions?${searchParams.toString()}`),
  })
}

export function useLastActivityBlock() {
  return useQuery({
    queryKey: ['activity-blocks', 'last'],
    queryFn: () => apiFetch('/api/v1/activity-blocks/last'),
  })
}

export function useCreateActivityBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/activity-blocks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-blocks'] })
    },
  })
}

export function useCreateBatchActivityBlocks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { blocks: Record<string, unknown>[] }) =>
      apiFetch('/api/v1/activity-blocks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-blocks'] })
    },
  })
}

export function useUpdateActivityBlock(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/activity-blocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-blocks'] })
    },
  })
}

export function useDeleteActivityBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/activity-blocks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-blocks'] })
    },
  })
}
