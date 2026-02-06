'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api/fetch'

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => <span className="font-medium">{(row.getValue('clients') as Record<string, string>)?.business_name || '-'}</span> },
  { accessorKey: 'notice_types', header: 'Type', cell: ({ row }) => (row.getValue('notice_types') as Record<string, string>)?.name || '-' },
  { accessorKey: 'section', header: 'Section' },
  { accessorKey: 'assessment_year', header: 'AY' },
  { accessorKey: 'due_date', header: 'Due Date', cell: ({ row }) => { const d = row.getValue('due_date') as string; return d ? new Date(d).toLocaleDateString('en-IN') : '-' } },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s = row.getValue('status') as string; return <Badge variant="secondary" className={statusColors[s]}>{s.replace(/_/g, ' ')}</Badge> } },
]

export default function NoticeManagementPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['notices', { page, search }],
    queryFn: () => apiFetch(`/api/v1/notices?page=${page}&pageSize=20&search=${search}`),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notice Management</h1>
        <p className="text-muted-foreground">Track and manage client notices</p>
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search notices..."
        onSearch={setSearch}
        onAdd={() => router.push('/notice-management/add')}
        addLabel="Add Notice"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/notice-management/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="notices" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
