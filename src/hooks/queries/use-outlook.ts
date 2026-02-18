'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useOutlookStatus() {
  return useQuery({
    queryKey: ['outlook', 'status'],
    queryFn: () => apiFetch('/api/v1/integrations/outlook/status'),
  })
}

export function useOutlookContacts(enabled = false) {
  return useQuery({
    queryKey: ['outlook', 'contacts'],
    queryFn: () => apiFetch('/api/v1/integrations/outlook/contacts'),
    enabled,
  })
}

export function useOutlookEmails(search?: string, enabled = false) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  return useQuery({
    queryKey: ['outlook', 'emails', search],
    queryFn: () => apiFetch(`/api/v1/integrations/outlook/emails?${params.toString()}`),
    enabled,
  })
}

export function useOutlookMeetings(enabled = false) {
  return useQuery({
    queryKey: ['outlook', 'meetings'],
    queryFn: () => apiFetch('/api/v1/integrations/outlook/meetings'),
    enabled,
  })
}

export function useImportOutlookContacts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contacts: Record<string, unknown>[]) =>
      apiFetch('/api/v1/integrations/outlook/contacts', {
        method: 'POST',
        body: JSON.stringify({ contacts }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useImportOutlookEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ emails, lead_id }: { emails: Record<string, unknown>[]; lead_id: string }) =>
      apiFetch('/api/v1/integrations/outlook/emails', {
        method: 'POST',
        body: JSON.stringify({ emails, lead_id }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-communications'] }),
  })
}

export function useImportOutlookMeetings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (meetings: Record<string, unknown>[]) =>
      apiFetch('/api/v1/integrations/outlook/meetings', {
        method: 'POST',
        body: JSON.stringify({ meetings }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useDisconnectOutlook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/v1/integrations/outlook/disconnect', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outlook'] }),
  })
}
