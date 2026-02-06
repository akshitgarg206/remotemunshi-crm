'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { FileText, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api/fetch'

const directionConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  in: { label: 'Received', color: 'bg-green-100 text-green-700', icon: ArrowDownLeft },
  out: { label: 'Given', color: 'bg-blue-100 text-blue-700', icon: ArrowUpRight },
  returned: { label: 'Returned', color: 'bg-yellow-100 text-yellow-700', icon: RotateCcw },
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'document_name', header: 'Document', cell: ({ row }) => <span className="font-medium">{row.getValue('document_name') as string}</span> },
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => (row.original as Record<string, Record<string, string>>)?.clients?.business_name || '-' },
  { accessorKey: 'person', header: 'Person' },
  { accessorKey: 'date', header: 'Date', cell: ({ row }) => { const d = row.getValue('date') as string; return d ? new Date(d).toLocaleDateString('en-IN') : '-' } },
  { accessorKey: 'direction', header: 'Direction', cell: ({ row }) => {
    const dir = row.getValue('direction') as string
    const cfg = directionConfig[dir]
    return cfg ? <Badge variant="secondary" className={cfg.color}>{cfg.label}</Badge> : dir
  }},
]

export default function DocumentsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { page, search }],
    queryFn: () => apiFetch(`/api/v1/documents?page=${page}&pageSize=20&search=${search}`),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents In/Out</h1>
        <p className="text-muted-foreground">Track physical document movement</p>
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search documents..."
        onSearch={setSearch}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />
    </div>
  )
}
