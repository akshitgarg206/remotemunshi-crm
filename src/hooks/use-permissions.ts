'use client'

import { useQuery } from '@tanstack/react-query'

interface Permission {
  module: string
  action: string
  allowed: boolean
  scope: string
}

interface PermissionsData {
  permissions: Permission[]
  is_admin: boolean
}

async function fetchPermissions(): Promise<PermissionsData> {
  const res = await fetch('/api/v1/auth/me')
  if (!res.ok) return { permissions: [], is_admin: false }
  const json = await res.json()
  return {
    permissions: json.data?.permissions ?? [],
    is_admin: json.data?.employee?.is_admin ?? false,
  }
}

export function usePermissions() {
  const { data, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
    staleTime: 5 * 60 * 1000, // 5 min cache
  })

  const permissions = data?.permissions ?? []
  const isAdmin = data?.is_admin ?? false

  function can(module: string, action: string): boolean {
    if (isAdmin) return true
    return permissions.some(
      (p) => p.module === module && p.action === action && p.allowed
    )
  }

  function canRead(module: string): boolean {
    return can(module, 'read')
  }

  return { can, canRead, isAdmin, isLoading, permissions }
}
