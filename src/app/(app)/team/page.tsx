'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { UsersRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiFetch } from '@/lib/api/fetch'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  on_leave: 'bg-yellow-100 text-yellow-700',
  terminated: 'bg-red-100 text-red-700',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'name', header: 'Name', cell: ({ row }) => {
      const name = row.getValue('name') as string
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      )
    },
  },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'mobile', header: 'Mobile' },
  { accessorKey: 'departments', header: 'Department', cell: ({ row }) => (row.getValue('departments') as Record<string, string>)?.name || '-' },
  { accessorKey: 'designations', header: 'Designation', cell: ({ row }) => (row.getValue('designations') as Record<string, string>)?.name || '-' },
  { accessorKey: 'roles', header: 'Role', cell: ({ row }) => { const r = (row.getValue('roles') as Record<string, string>); return r ? <Badge variant="secondary">{r.name}</Badge> : '-' } },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s = row.getValue('status') as string; return <Badge variant="secondary" className={statusColors[s]}>{s.replace(/_/g, ' ')}</Badge> } },
]

export default function TeamPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)

  const sp = new URLSearchParams()
  sp.set('page', String(page))
  sp.set('pageSize', '20')
  if (search) sp.set('search', search)
  if (statusFilter) sp.set('status', statusFilter)

  const { data, isLoading } = useQuery({
    queryKey: ['team', { page, search, status: statusFilter }],
    queryFn: () => apiFetch(`/api/v1/team?${sp.toString()}`),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">Manage your team members</p>
      </div>

      <Tabs defaultValue="" onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="on_leave">On Leave</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataGrid
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search team..."
        onSearch={setSearch}
        onAdd={() => router.push('/team/add')}
        addLabel="Add Member"
        onImport={() => setImportOpen(true)}
        onRowClick={(row) => router.push('/team/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
      />

      <CsvImporter module="team" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
