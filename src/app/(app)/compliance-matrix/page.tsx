'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MatrixKpiCards } from './_components/matrix-kpi-cards'
import { MatrixFilters, ViewMode } from './_components/matrix-filters'
import { ServiceView } from './_components/service-view'
import { PeriodView } from './_components/period-view'
import { ClientView } from './_components/client-view'
import { GroupView } from './_components/group-view'
import { useComplianceMatrixKpi } from '@/hooks/queries/use-compliance-matrix'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'compliance-matrix-filters'

interface SavedFilters {
  viewMode: ViewMode
  serviceId: string
  clientId: string
  groupId: string
  month: string
  year: string
  status: string
}

function loadFilters(): SavedFilters {
  if (typeof window === 'undefined') return defaultFilters()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Migrate old empty-string status to __all__ sentinel
      if (parsed.status === '') parsed.status = '__all__'
      return parsed
    }
  } catch { /* ignore */ }
  return defaultFilters()
}

function defaultFilters(): SavedFilters {
  const now = new Date()
  return {
    viewMode: 'service',
    serviceId: '',
    clientId: '',
    groupId: '',
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    status: '__all__',
  }
}

const viewModes: { value: ViewMode; label: string }[] = [
  { value: 'service', label: 'By Service' },
  { value: 'period', label: 'By Period' },
  { value: 'client', label: 'By Client' },
  { value: 'group', label: 'By Group' },
]

export default function ComplianceMatrixPage() {
  const [filters, setFilters] = useState<SavedFilters>(defaultFilters)

  // Load from localStorage on mount
  useEffect(() => {
    setFilters(loadFilters())
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(filters)) } catch { /* ignore */ }
  }, [filters])

  const update = <K extends keyof SavedFilters>(key: K, value: SavedFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // KPI params scoped to current filters
  const kpiParams: Record<string, string | number | undefined> = {
    month: Number(filters.month),
    year: Number(filters.year),
  }
  if (filters.serviceId) kpiParams.service_id = filters.serviceId
  if (filters.clientId && filters.viewMode === 'client') kpiParams.client_id = filters.clientId
  if (filters.groupId && filters.viewMode === 'group') kpiParams.group_id = filters.groupId

  const { data: kpiData, isLoading: kpiLoading } = useComplianceMatrixKpi(kpiParams)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance Matrix</h1>
        <p className="text-muted-foreground">Cross-client compliance status at a glance</p>
      </div>

      {/* KPI Cards */}
      <MatrixKpiCards data={kpiData} isLoading={kpiLoading} />

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 rounded-lg border p-1 w-fit">
        {viewModes.map((vm) => (
          <Button
            key={vm.value}
            variant={filters.viewMode === vm.value ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-8 text-xs',
              filters.viewMode === vm.value && 'shadow-sm'
            )}
            onClick={() => update('viewMode', vm.value)}
          >
            {vm.label}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <MatrixFilters
        viewMode={filters.viewMode}
        serviceId={filters.serviceId}
        setServiceId={(v) => update('serviceId', v)}
        clientId={filters.clientId}
        setClientId={(v) => update('clientId', v)}
        groupId={filters.groupId}
        setGroupId={(v) => update('groupId', v)}
        month={filters.month}
        setMonth={(v) => update('month', v)}
        year={filters.year}
        setYear={(v) => update('year', v)}
        status={filters.status}
        setStatus={(v) => update('status', v)}
      />

      {/* View Content */}
      {filters.viewMode === 'service' && (
        <ServiceView
          serviceId={filters.serviceId}
          month={filters.month}
          year={filters.year}
          status={filters.status}
        />
      )}
      {filters.viewMode === 'period' && (
        <PeriodView year={filters.year} />
      )}
      {filters.viewMode === 'client' && (
        <ClientView clientId={filters.clientId} year={filters.year} />
      )}
      {filters.viewMode === 'group' && (
        <GroupView
          groupId={filters.groupId}
          serviceId={filters.serviceId}
          month={filters.month}
          year={filters.year}
          status={filters.status}
        />
      )}
    </div>
  )
}
