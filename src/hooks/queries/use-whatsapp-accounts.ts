'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export interface WhatsAppAccount {
  id: string
  phone_number_id: string
  waba_id: string
  display_phone_number: string
  business_name: string | null
  status: 'active' | 'disconnected'
  is_default: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export function useWhatsAppAccounts() {
  return useQuery({
    queryKey: ['whatsapp-accounts'],
    queryFn: () => apiFetch<WhatsAppAccount[]>('/api/v1/whatsapp/accounts'),
  })
}

export function useCreateWhatsAppAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      phone_number_id: string
      waba_id: string
      access_token: string
      display_phone_number: string
      business_name?: string
    }) => apiFetch('/api/v1/whatsapp/accounts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-accounts'] }),
  })
}

export function useUpdateWhatsAppAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/v1/whatsapp/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-accounts'] }),
  })
}

export function useDeleteWhatsAppAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/whatsapp/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-accounts'] }),
  })
}

export function useExchangeWhatsAppToken() {
  return useMutation({
    mutationFn: (data: { code: string; phone_number_id: string; waba_id: string }) =>
      apiFetch('/api/v1/whatsapp/token-exchange', { method: 'POST', body: JSON.stringify(data) }),
  })
}
