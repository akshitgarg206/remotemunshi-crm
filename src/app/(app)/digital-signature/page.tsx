'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { FileKey, ShieldCheck, ShieldAlert, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api/fetch'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  revoked: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'holder_name', header: 'Holder Name', cell: ({ row }) => <span className="font-medium">{row.getValue('holder_name') as string}</span> },
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => (row.getValue('clients') as Record<string, string>)?.business_name || '-' },
  { accessorKey: 'class', header: 'Class', cell: ({ row }) => <Badge variant="secondary">{(row.getValue('class') as string || '').replace('_', ' ').toUpperCase()}</Badge> },
  { accessorKey: 'expiry_date', header: 'Expiry', cell: ({ row }) => { const d = row.getValue('expiry_date') as string; return d ? new Date(d).toLocaleDateString('en-IN') : '-' } },
  { accessorKey: 'location', header: 'Location', cell: ({ row }) => <span className="capitalize">{(row.getValue('location') as string || '').replace(/_/g, ' ')}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s = row.getValue('status') as string; return <Badge variant="secondary" className={statusColors[s]}>{s}</Badge> } },
]

export default function DscPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['dscs', { page, search }],
    queryFn: () => apiFetch(`/api/v1/dscs?page=${page}&pageSize=20&search=${search}`),
  })
  const { data: kpiData } = useQuery({
    queryKey: ['dscs', 'kpi'],
    queryFn: () => apiFetch('/api/v1/dscs/kpi'),
  })
  const kpis = kpiData?.data as Record<string, number> | undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Digital Signatures</h1>
        <p className="text-muted-foreground">Manage DSC tokens and certificates</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total DSCs" value={kpis?.total_dscs ?? 0} icon={FileKey} color="bg-primary" />
        <KpiCard title="Active" value={kpis?.active_dscs ?? 0} icon={ShieldCheck} color="bg-green-500" />
        <KpiCard title="Expired" value={kpis?.expired_dscs ?? 0} icon={ShieldAlert} color="bg-red-500" />
        <KpiCard title="Expiring Soon" value={kpis?.expiring_soon ?? 0} icon={Clock} color="bg-yellow-500" />
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search DSCs..."
        onSearch={setSearch}
        onAdd={() => router.push('/digital-signature/add')}
        addLabel="Add DSC"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/digital-signature/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="dscs" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
