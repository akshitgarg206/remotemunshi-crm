'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useContacts(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) searchParams.set(k, String(v)) })

  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => apiFetch(`/api/v1/contacts?${searchParams.toString()}`),
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => apiFetch(`/api/v1/contacts/${id}`),
    enabled: !!id,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/v1/contacts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

export function useUpdateContact(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contacts', id] })
    },
  })
}

export function useDeleteContact(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch(`/api/v1/contacts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

// Client-scoped contact hooks
export function useClientContacts(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'contacts'],
    queryFn: () => apiFetch(`/api/v1/clients/${clientId}/contacts`),
    enabled: !!clientId,
  })
}

export function useLinkContact(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { contact_id: string; role?: string; is_primary?: boolean }) =>
      apiFetch(`/api/v1/clients/${clientId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'contacts'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUnlinkContact(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contactId: string) =>
      apiFetch(`/api/v1/clients/${clientId}/contacts?contact_id=${contactId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'contacts'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
