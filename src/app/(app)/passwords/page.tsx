'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Lock, Eye, EyeOff, Copy } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name') as string}</span> },
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => (row.original as Record<string, Record<string, string>>)?.clients?.business_name || '-' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'link', header: 'Link', cell: ({ row }) => { const l = row.getValue('link') as string; return l ? <a href={l} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate max-w-[200px] block">{l}</a> : '-' } },
  { accessorKey: 'remark', header: 'Remark' },
]

export default function PasswordsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['passwords', { page, search }],
    queryFn: () => apiFetch(`/api/v1/passwords?page=${page}&pageSize=20&search=${search}`),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Password Vault</h1>
        <p className="text-muted-foreground">Securely store client credentials</p>
      </div>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search passwords..."
        onSearch={setSearch}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />
    </div>
  )
}
