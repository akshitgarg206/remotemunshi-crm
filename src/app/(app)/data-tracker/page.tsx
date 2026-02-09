'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { ClipboardCheck, Clock, CheckCircle2, AlertTriangle, Send, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useDeadlines, useDeadlineKpi, useGenerateDeadlines } from '@/hooks/queries/use-deadlines'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { StatusBadge } from '@/components/status-badge'

const statusColors: Record<string, string> = {
  data_pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  data_received: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  in_progress: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  filed: 'bg-green-500/10 text-green-700 dark:text-green-400',
  overdue: 'bg-red-500/10 text-red-700 dark:text-red-400',
  upcoming: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return '-'
  }
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'clients',
    header: 'Client',
    cell: ({ row }) => {
      const client = row.getValue('clients') as Record<string, string> | null
      return <span className="font-medium">{client?.business_name || '-'}</span>
    },
  },
  {
    accessorKey: 'services',
    header: 'Service',
    cell: ({ row }) => {
      const service = row.getValue('services') as Record<string, string> | null
      return service?.name || '-'
    },
  },
  {
    accessorKey: 'period_label',
    header: 'Period',
  },
  {
    accessorKey: 'due_date',
    header: 'Due Date',
    cell: ({ row }) => {
      const dateStr = row.original.due_date as string | null
      if (!dateStr) return '-'
      const dueDate = new Date(dateStr)
      const now = new Date()
      const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isOverdue = daysLeft < 0
      return (
        <div>
          <p className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>{formatDate(dateStr)}</p>
          {isOverdue && <p className="text-xs text-red-600 dark:text-red-400">{Math.abs(daysLeft)}d overdue</p>}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status') as string} />,
  },
  {
    accessorKey: 'data_received',
    header: 'Data',
    cell: ({ row }) => {
      const received = row.getValue('data_received') as boolean
      return received ? (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs">Received</span>
        </span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-xs">Pending</span>
        </span>
      )
    },
  },
]

export default function DataTrackerPage() {
  const router = useRouter()
  const now = new Date()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedService, setSelectedService] = useState<string>('')
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [generateOpen, setGenerateOpen] = useState(false)
  const [genServiceId, setGenServiceId] = useState('')
  const [genMonth, setGenMonth] = useState(String(now.getMonth() + 1))
  const [genYear, setGenYear] = useState(String(now.getFullYear()))

  // Build query params
  const params: Record<string, string | number | undefined> = {
    page,
    pageSize: 50,
    search: search || undefined,
    month: Number(month),
    year: Number(year),
  }
  if (activeTab !== 'all') params.status = activeTab
  if (selectedService) params.service_id = selectedService

  const { data: deadlinesData, isLoading } = useDeadlines(params)
  const { data: kpiData } = useDeadlineKpi()
  const kpis = (kpiData as any)?.data as Record<string, number> | undefined

  // Services list for filter
  const { data: servicesData } = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => apiFetch('/api/v1/services?pageSize=100'),
  })
  const servicesList = ((servicesData as any)?.data ?? []) as Record<string, any>[]

  const generateMutation = useGenerateDeadlines()

  const handleGenerate = () => {
    if (!genServiceId) {
      toast.error('Please select a service')
      return
    }
    generateMutation.mutate(
      { service_id: genServiceId, month: Number(genMonth), year: Number(genYear) },
      {
        onSuccess: (res: any) => {
          const count = res?.data?.count ?? 0
          toast.success(`Generated ${count} deadline(s)`)
          setGenerateOpen(false)
        },
        onError: () => toast.error('Failed to generate deadlines'),
      }
    )
  }

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Tracker</h1>
        <p className="text-muted-foreground">Track data collection from clients</p>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Data Pending" value={kpis?.data_pending ?? 0} icon={Clock} color="bg-yellow-500" />
        <KpiCard title="Data Received" value={kpis?.data_received ?? 0} icon={CheckCircle2} color="bg-green-500" />
        <KpiCard title="Filed / In Progress" value={kpis?.filed ?? 0} icon={ClipboardCheck} color="bg-blue-500" />
        <KpiCard title="Overdue" value={kpis?.overdue ?? 0} icon={AlertTriangle} color="bg-red-500" />
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          className="w-[100px]"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min={2020}
          max={2099}
        />

        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Services</SelectItem>
            {servicesList.map((s) => (
              <SelectItem key={s.id} value={s.id as string}>{s.name as string}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setGenerateOpen(true)}>
          <Calendar className="mr-2 h-4 w-4" />
          Generate Deadlines
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="data_pending">Data Pending</TabsTrigger>
          <TabsTrigger value="data_received">Data Received</TabsTrigger>
          <TabsTrigger value="filed">Filed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* DataGrid */}
      <DataGrid
        columns={columns}
        data={(deadlinesData?.data as Record<string, unknown>[]) || []}
        isLoading={isLoading}
        searchPlaceholder="Search deadlines..."
        onSearch={setSearch}
        onRowClick={(row) => router.push('/data-tracker/' + (row as Record<string, unknown>).id)}
        page={page}
        pageCount={deadlinesData?.meta?.totalPages || 1}
        totalItems={deadlinesData?.meta?.total}
        onPageChange={setPage}
      />

      {/* Generate Deadlines Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Deadlines</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service *</Label>
              <Select value={genServiceId} onValueChange={setGenServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {servicesList.map((s) => (
                    <SelectItem key={s.id} value={s.id as string}>{s.name as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={genMonth} onValueChange={setGenMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" value={genYear} onChange={(e) => setGenYear(e.target.value)} min={2020} max={2099} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
