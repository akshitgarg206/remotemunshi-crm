'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useConversations(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) searchParams.set(k, String(v)) })

  return useQuery({
    queryKey: ['support-conversations', params],
    queryFn: () => apiFetch(`/api/v1/support/conversations?${searchParams.toString()}`),
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['support-conversations', id],
    queryFn: () => apiFetch(`/api/v1/support/conversations/${id}`),
    enabled: !!id,
  })
}

export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/support/conversations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-conversations'] }),
  })
}

export function useUpdateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/v1/support/conversations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['support-conversations'] })
      qc.invalidateQueries({ queryKey: ['support-conversations', id] })
    },
  })
}

export function useConversationMessages(conversationId: string, params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) searchParams.set(k, String(v)) })

  return useQuery({
    queryKey: ['support-messages', conversationId, params],
    queryFn: () => apiFetch(`/api/v1/support/conversations/${conversationId}/messages?${searchParams.toString()}`),
    enabled: !!conversationId,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/v1/support/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ['support-messages', conversationId] })
      qc.invalidateQueries({ queryKey: ['support-conversations'] })
    },
  })
}

export function useAssignConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, employeeId }: { conversationId: string; employeeId: string }) =>
      apiFetch(`/api/v1/support/conversations/${conversationId}/assign`, { method: 'POST', body: JSON.stringify({ employee_id: employeeId }) }),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ['support-conversations'] })
      qc.invalidateQueries({ queryKey: ['support-conversations', conversationId] })
    },
  })
}

export function useTakeoverConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (conversationId: string) =>
      apiFetch(`/api/v1/support/conversations/${conversationId}/takeover`, { method: 'POST' }),
    onSuccess: (_, conversationId) => {
      qc.invalidateQueries({ queryKey: ['support-conversations'] })
      qc.invalidateQueries({ queryKey: ['support-conversations', conversationId] })
    },
  })
}

export function useMarkConversationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, unread }: { conversationId: string; unread?: boolean }) =>
      apiFetch(`/api/v1/support/conversations/${conversationId}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ unread: !!unread }),
      }),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ['support-conversations'] })
      qc.invalidateQueries({ queryKey: ['support-conversations', conversationId] })
    },
  })
}
