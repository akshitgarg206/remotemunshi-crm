'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useTasks(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) searchParams.set(k, String(v)) })

  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => apiFetch(`/api/v1/tasks?${searchParams.toString()}`),
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => apiFetch(`/api/v1/tasks/${id}`),
    enabled: !!id,
  })
}

export function useTaskSummary() {
  return useQuery({
    queryKey: ['tasks', 'summary'],
    queryFn: () => apiFetch('/api/v1/tasks/summary'),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/api/v1/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch(`/api/v1/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useMyTasks(params?: Record<string, string | number | undefined>) {
  return useTasks({ ...params, my_tasks: 'true' })
}

export function useMyReviews(params?: Record<string, string | number | undefined>) {
  return useTasks({ ...params, my_reviews: 'true' })
}

export function useReviewTask(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { action: 'approve' | 'request_changes'; comment?: string }) =>
      apiFetch(`/api/v1/tasks/${taskId}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks', taskId] })
    },
  })
}

export function useSubTasks(parentTaskId: string) {
  return useQuery({
    queryKey: ['tasks', parentTaskId, 'sub-tasks'],
    queryFn: () => apiFetch(`/api/v1/tasks/${parentTaskId}/sub-tasks`),
    enabled: !!parentTaskId,
  })
}

export function useCreateSubTask(parentTaskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/tasks/${parentTaskId}/sub-tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', parentTaskId, 'sub-tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks', parentTaskId] })
    },
  })
}
