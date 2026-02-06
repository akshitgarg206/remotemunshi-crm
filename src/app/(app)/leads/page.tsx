'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { UserPlus, Users, UserCheck, TrendingUp } from 'lucide-react'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { Badge } from '@/components/ui/badge'
import { useLeads, useLeadKpis } from '@/hooks/queries/use-leads'

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'business_name', header: 'Business Name', cell: ({ row }) => <span className="font-medium">{row.getValue('business_name') as string}</span> },
  { accessorKey: 'contact_person', header: 'Contact Person' },
  { accessorKey: 'contact_no', header: 'Phone' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'source', header: 'Source', cell: ({ row }) => <Badge variant="secondary" className="capitalize">{(row.getValue('source') as string || '').replace(/_/g, ' ')}</Badge> },
  { accessorKey: 'lead_stages', header: 'Stage', cell: ({ row }) => {
    const stage = row.getValue('lead_stages') as Record<string, string> | null
    return stage ? <Badge style={{ backgroundColor: stage.color + '20', color: stage.color }}>{stage.name}</Badge> : '-'
  }},
]

export default function LeadsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const { data: leadsData, isLoading } = useLeads({ page, pageSize: 20, search })
  const { data: kpiData } = useLeadKpis()
  const kpis = kpiData?.data as Record<string, number> | undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">Track and convert potential clients</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Leads" value={kpis?.total_leads ?? 0} icon={Users} color="bg-primary" />
        <KpiCard title="This Month" value={kpis?.leads_this_month ?? 0} icon={UserPlus} color="bg-purple-500" />
        <KpiCard title="Converted" value={kpis?.converted_leads ?? 0} icon={UserCheck} color="bg-green-500" />
        <KpiCard title="Conversion Rate" value={`${kpis?.conversion_rate ?? 0}%`} icon={TrendingUp} color="bg-yellow-500" />
      </div>

      <DataGrid
        columns={columns}
        data={(leadsData?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search leads..."
        onSearch={setSearch}
        onAdd={() => router.push('/leads/add')}
        addLabel="Add Lead"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/leads/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={leadsData?.meta?.totalPages || 1}
        totalItems={leadsData?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="leads" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
