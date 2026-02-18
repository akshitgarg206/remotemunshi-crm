'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useRedditStatus() {
  return useQuery({
    queryKey: ['reddit', 'status'],
    queryFn: () => apiFetch('/api/v1/integrations/reddit/status'),
  })
}

export function useRedditPosts(enabled = false) {
  return useQuery({
    queryKey: ['reddit', 'posts'],
    queryFn: () => apiFetch('/api/v1/integrations/reddit/posts'),
    enabled,
  })
}

export function useRedditComments(postId: string | null) {
  return useQuery({
    queryKey: ['reddit', 'comments', postId],
    queryFn: () => apiFetch(`/api/v1/integrations/reddit/posts/${postId}/comments`),
    enabled: !!postId,
  })
}

export function useRedditMessages(enabled = false) {
  return useQuery({
    queryKey: ['reddit', 'messages'],
    queryFn: () => apiFetch('/api/v1/integrations/reddit/messages'),
    enabled,
  })
}

export function useImportRedditLeads() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: { type: 'comment' | 'message'; id: string; author: string; body: string; post_title?: string }[]) =>
      apiFetch('/api/v1/integrations/reddit/import', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useDisconnectReddit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/v1/integrations/reddit/disconnect', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reddit'] }),
  })
}
