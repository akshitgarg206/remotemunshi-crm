'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataGrid } from '@/components/data-grid/data-grid'
import { Badge } from '@/components/ui/badge'
import { useTaskTemplates } from '@/hooks/queries/use-task-templates'

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half Yearly',
  yearly: 'Yearly',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'task_name',
    header: 'Template Name',
    cell: ({ row }) => <span className="font-medium">{row.getValue('task_name') as string}</span>,
  },
  {
    accessorKey: 'services',
    header: 'Service',
    cell: ({ row }) => {
      const s = row.getValue('services') as Record<string, string> | null
      return s?.name || '-'
    },
  },
  {
    accessorKey: 'frequency',
    header: 'Frequency',
    cell: ({ row }) => {
      const f = row.getValue('frequency') as string
      return <Badge variant="secondary">{frequencyLabels[f] || f}</Badge>
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
      const p = row.getValue('priority') as string
      const colors: Record<string, string> = {
        low: 'bg-gray-100 text-gray-700',
        medium: 'bg-blue-100 text-blue-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700',
      }
      return <Badge variant="secondary" className={colors[p]}>{p}</Badge>
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const active = row.getValue('is_active') as boolean
      return (
        <Badge variant="secondary" className={active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
          {active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'recurring_task_assignees',
    header: 'Assignees',
    cell: ({ row }) => {
      const assignees = row.getValue('recurring_task_assignees') as Record<string, unknown>[] | null
      return assignees?.length || 0
    },
  },
]

export default function TaskTemplatesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useTaskTemplates({ page, pageSize: 20, search })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Task Templates</h1>
        <p className="text-muted-foreground">Manage recurring task templates that auto-create tasks</p>
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search templates..."
        onSearch={setSearch}
        onAdd={() => router.push('/task/templates/add')}
        addLabel="Create Template"
        onRowClick={(row) => router.push(`/task/templates/${(row as Record<string, unknown>).id}`)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />
    </div>
  )
}
