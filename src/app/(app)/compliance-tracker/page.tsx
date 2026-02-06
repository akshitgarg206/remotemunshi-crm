'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { ClipboardCheck, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api/fetch'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  filed: 'bg-green-100 text-green-700',
  not_applicable: 'bg-gray-100 text-gray-700',
}

const typeColors: Record<string, string> = {
  gst: 'bg-blue-100 text-blue-700',
  income_tax: 'bg-purple-100 text-purple-700',
  mca: 'bg-orange-100 text-orange-700',
  tds: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-700',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => <span className="font-medium">{(row.getValue('clients') as Record<string, string>)?.business_name || '-'}</span> },
  { accessorKey: 'compliance_type', header: 'Type', cell: ({ row }) => { const t = row.getValue('compliance_type') as string; return <Badge variant="secondary" className={typeColors[t]}>{t.replace(/_/g, ' ').toUpperCase()}</Badge> } },
  { accessorKey: 'form_name', header: 'Form' },
  { accessorKey: 'period', header: 'Period' },
  { accessorKey: 'due_date', header: 'Due Date', cell: ({ row }) => { const d = row.getValue('due_date') as string; if (!d) return '-'; const date = new Date(d); const isOverdue = date < new Date(); return <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{date.toLocaleDateString('en-IN')}</span> } },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s = row.getValue('status') as string; return <Badge variant="secondary" className={statusColors[s]}>{s.replace(/_/g, ' ')}</Badge> } },
  { accessorKey: 'financial_years', header: 'FY', cell: ({ row }) => (row.getValue('financial_years') as Record<string, string>)?.name || '-' },
]

export default function ComplianceTrackerPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)

  const params: Record<string, string | number> = { page, pageSize: 20, search }
  if (typeFilter) params.compliance_type = typeFilter
  if (statusFilter) params.status = statusFilter

  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => sp.set(k, String(v)))

  const { data, isLoading } = useQuery({
    queryKey: ['compliance', params],
    queryFn: () => apiFetch(`/api/v1/compliance?${sp.toString()}`),
  })
  const { data: kpiData } = useQuery({
    queryKey: ['compliance', 'kpi'],
    queryFn: () => apiFetch('/api/v1/compliance/kpi'),
  })
  const kpis = kpiData?.data as Record<string, number> | undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance Tracker</h1>
        <p className="text-muted-foreground">Monitor GST, IT, MCA, and TDS filings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Entries" value={kpis?.total_entries ?? 0} icon={ClipboardCheck} color="bg-primary" />
        <KpiCard title="Pending" value={kpis?.pending ?? 0} icon={Clock} color="bg-yellow-500" />
        <KpiCard title="Filed" value={kpis?.filed ?? 0} icon={CheckCircle} color="bg-green-500" />
        <KpiCard title="Overdue" value={kpis?.overdue ?? 0} icon={AlertTriangle} color="bg-red-500" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="gst">GST</SelectItem>
            <SelectItem value="income_tax">Income Tax</SelectItem>
            <SelectItem value="mca">MCA</SelectItem>
            <SelectItem value="tds">TDS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="filed">Filed</SelectItem>
            <SelectItem value="not_applicable">N/A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search compliance..."
        onSearch={setSearch}
        onImport={() => setImportOpen(true)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="compliance" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
