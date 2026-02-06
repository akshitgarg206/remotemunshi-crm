import type { ApiResponse } from '@/types/api'

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Request failed')
  return data
}
