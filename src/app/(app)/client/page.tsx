'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { Badge } from '@/components/ui/badge'
import { useClients, useClientKpis } from '@/hooks/queries/use-clients'

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-300',
  inactive: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
  on_hold: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  closed: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'business_name',
    header: 'Business Name',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('business_name') as string}</span>
    ),
  },
  { accessorKey: 'contact_name', header: 'Contact Person' },
  { accessorKey: 'mobile', header: 'Mobile' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'business_entity',
    header: 'Entity Type',
    cell: ({ row }) => {
      const val = row.getValue('business_entity') as string
      return val ? <span className="capitalize">{val.replace(/_/g, ' ')}</span> : '-'
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant="secondary" className={statusColors[status] || ''}>
          {status}
        </Badge>
      )
    },
  },
]

export default function ClientListPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const { data: clientsData, isLoading } = useClients({ page, pageSize: 20, search })
  const { data: kpiData } = useClientKpis()
  const kpis = kpiData?.data as Record<string, number> | undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">Manage your client base</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Clients" value={kpis?.total_clients ?? 0} icon={Users} color="bg-primary" />
        <KpiCard title="Active" value={kpis?.active_clients ?? 0} icon={UserCheck} color="bg-green-500" />
        <KpiCard title="Inactive" value={kpis?.inactive_clients ?? 0} icon={UserX} color="bg-gray-500" />
        <KpiCard title="New This Month" value={kpis?.new_this_month ?? 0} icon={UserPlus} color="bg-purple-500" />
      </div>

      {/* Data Grid */}
      <DataGrid
        columns={columns}
        data={(clientsData?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search clients..."
        onSearch={setSearch}
        onAdd={() => router.push('/client/add')}
        addLabel="Add Client"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/client/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={clientsData?.meta?.totalPages || 1}
        totalItems={clientsData?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="clients" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
