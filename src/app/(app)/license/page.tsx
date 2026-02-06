'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Award, ShieldCheck, ShieldAlert, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { apiFetch } from '@/lib/api/fetch'

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'license_name', header: 'License Name', cell: ({ row }) => <span className="font-medium">{row.getValue('license_name') as string}</span> },
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => (row.getValue('clients') as Record<string, string>)?.business_name || '-' },
  { accessorKey: 'registration_no', header: 'Reg. No.' },
  { accessorKey: 'issuing_authority', header: 'Authority' },
  { accessorKey: 'expiry_date', header: 'Expiry', cell: ({ row }) => { const d = row.getValue('expiry_date') as string; return d ? new Date(d).toLocaleDateString('en-IN') : '-' } },
]

export default function LicensePage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['licenses', { page, search }],
    queryFn: () => apiFetch(`/api/v1/licenses?page=${page}&pageSize=20&search=${search}`),
  })
  const { data: kpiData } = useQuery({
    queryKey: ['licenses', 'kpi'],
    queryFn: () => apiFetch('/api/v1/licenses/kpi'),
  })
  const kpis = kpiData?.data as Record<string, number> | undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Licenses</h1>
        <p className="text-muted-foreground">Track client licenses and registrations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total" value={kpis?.total_licenses ?? 0} icon={Award} color="bg-primary" />
        <KpiCard title="Active" value={kpis?.active_licenses ?? 0} icon={ShieldCheck} color="bg-green-500" />
        <KpiCard title="Expired" value={kpis?.expired_licenses ?? 0} icon={ShieldAlert} color="bg-red-500" />
        <KpiCard title="Expiring Soon" value={kpis?.expiring_soon ?? 0} icon={Clock} color="bg-yellow-500" />
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search licenses..."
        onSearch={setSearch}
        onAdd={() => router.push('/license/add')}
        addLabel="Add License"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/license/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="licenses" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
