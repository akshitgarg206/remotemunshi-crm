'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { DataGrid } from '@/components/data-grid/data-grid'
import { Badge } from '@/components/ui/badge'
import { useComplianceMatrix } from '@/hooks/queries/use-compliance-matrix'
import { DeadlineDrawer } from './deadline-drawer'

/* eslint-disable @typescript-eslint/no-explicit-any */

const statusColors: Record<string, string> = {
  data_pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  data_received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  filed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function fmtDate(d: string | null): string {
  if (!d) return '-'
  try { return format(new Date(d), 'dd MMM yyyy') } catch { return '-' }
}

function fmtStatus(s: string): string {
  return (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'clients',
    header: 'Client',
    cell: ({ row }) => {
      const c = row.getValue('clients') as any
      return (
        <div>
          <span className="font-medium">{c?.business_name || '-'}</span>
          {c?.client_code && <span className="ml-2 text-xs text-muted-foreground">{c.client_code}</span>}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <Badge className={statusColors[status] || 'bg-gray-100 text-gray-700'}>{fmtStatus(status)}</Badge>
    },
  },
  {
    accessorKey: 'due_date',
    header: 'Due Date',
    cell: ({ row }) => {
      const d = row.getValue('due_date') as string
      const isOverdue = d && new Date(d) < new Date() && row.original.status !== 'filed'
      return <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>{fmtDate(d)}</span>
    },
  },
  {
    accessorKey: 'data_received',
    header: 'Data',
    cell: ({ row }) => row.getValue('data_received')
      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
      : <Clock className="h-4 w-4 text-gray-400" />,
  },
  {
    accessorKey: 'tasks',
    header: 'Task',
    cell: ({ row }) => {
      const t = row.getValue('tasks') as any
      if (!t) return <span className="text-muted-foreground text-xs">No task</span>
      return <span className="text-xs">{fmtStatus(t.status)}</span>
    },
  },
]

interface ServiceViewProps {
  serviceId: string
  month: string
  year: string
  status: string
}

export function ServiceView({ serviceId, month, year, status }: ServiceViewProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDeadline, setSelectedDeadline] = useState<any>(null)

  const params: Record<string, string | number | undefined> = {
    view: 'service',
    service_id: serviceId || undefined,
    month: Number(month),
    year: Number(year),
    page,
    pageSize: 50,
    search: search || undefined,
    status: status || undefined,
  }

  const { data, isLoading } = useComplianceMatrix(serviceId ? params : undefined)

  if (!serviceId) {
    return <p className="text-muted-foreground text-center py-12">Select a service to view compliance status across all clients.</p>
  }

  const handleRowClick = (row: any) => {
    setSelectedDeadline(row)
    setDrawerOpen(true)
  }

  return (
    <>
      <DataGrid
        columns={columns}
        data={(data?.data as any[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search clients..."
        onSearch={setSearch}
        onRowClick={handleRowClick}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />
      <DeadlineDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        deadline={selectedDeadline}
      />
    </>
  )
}
