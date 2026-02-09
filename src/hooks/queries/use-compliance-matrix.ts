'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'

export function useComplianceMatrix(params?: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) sp.set(k, String(v)) })
  return useQuery({
    queryKey: ['compliance-matrix', params],
    queryFn: () => apiFetch(`/api/v1/compliance-matrix?${sp.toString()}`),
    enabled: !!params?.view,
  })
}

export function useComplianceMatrixKpi(params?: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) sp.set(k, String(v)) })
  return useQuery({
    queryKey: ['compliance-matrix', 'kpi', params],
    queryFn: () => apiFetch(`/api/v1/compliance-matrix/kpi?${sp.toString()}`),
  })
}
