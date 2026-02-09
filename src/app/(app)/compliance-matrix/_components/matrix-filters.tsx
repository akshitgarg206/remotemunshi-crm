'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ViewMode = 'service' | 'period' | 'client' | 'group'

interface MatrixFiltersProps {
  viewMode: ViewMode
  serviceId: string
  setServiceId: (v: string) => void
  clientId: string
  setClientId: (v: string) => void
  groupId: string
  setGroupId: (v: string) => void
  month: string
  setMonth: (v: string) => void
  year: string
  setYear: (v: string) => void
  status: string
  setStatus: (v: string) => void
}

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'data_pending', label: 'Data Pending' },
  { value: 'data_received', label: 'Data Received' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'filed', label: 'Filed' },
]

export function MatrixFilters({
  viewMode, serviceId, setServiceId, clientId, setClientId,
  groupId, setGroupId, month, setMonth, year, setYear, status, setStatus,
}: MatrixFiltersProps) {
  // Fetch services
  const { data: servicesData } = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => apiFetch('/api/v1/services?pageSize=100'),
  })
  const services = ((servicesData as any)?.data ?? []) as any[]

  // Fetch clients (for client view)
  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => apiFetch('/api/v1/clients?pageSize=200'),
    enabled: viewMode === 'client',
  })
  const clients = ((clientsData as any)?.data ?? []) as any[]

  // Fetch groups
  const { data: groupsData } = useQuery({
    queryKey: ['settings', 'client-groups'],
    queryFn: () => apiFetch('/api/v1/settings/client-groups'),
    enabled: viewMode === 'group',
  })
  const groups = ((groupsData as any)?.data ?? []) as any[]

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Service selector — for service view and group view */}
      {(viewMode === 'service' || viewMode === 'group') && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Service</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Client selector — for client view */}
      {viewMode === 'client' && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Client</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Group selector — for group view */}
      {viewMode === 'group' && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Client Group</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g: any) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Month/Year — for service, client, group views */}
      {viewMode !== 'period' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Year</Label>
            <Input
              type="number"
              className="w-[90px]"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={2020}
              max={2099}
            />
          </div>
        </>
      )}

      {/* Year range — for period view */}
      {viewMode === 'period' && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Financial Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>Apr {y} - Mar {y + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status filter — for service and group views */}
      {(viewMode === 'service' || viewMode === 'group') && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
