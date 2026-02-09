'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { StatusBadge } from '@/components/status-badge'
import { useClients, useClientKpis } from '@/hooks/queries/use-clients'

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'business_name',
    header: 'Client',
    cell: ({ row }) => {
      const name = (row.getValue('business_name') as string) || (row.original.contact_name as string) || 'Unnamed'
      const initials = name.slice(0, 2).toUpperCase()
      const code = row.original.client_code as string | undefined
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{name}</p>
            {code && <p className="text-xs text-muted-foreground font-mono">{code}</p>}
          </div>
        </div>
      )
    },
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
    cell: ({ row }) => <StatusBadge status={row.getValue('status') as string} />,
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
        emptyTitle="No clients yet"
        emptyDescription="Add your first client to get started."
        emptyActionLabel="Add Client"
        onEmptyAction={() => router.push('/client/add')}
      />

      <CsvImporter module="clients" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
