'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { UserPlus, Users, UserCheck, TrendingUp, Flame, DollarSign, Clock, LayoutGrid, List } from 'lucide-react'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { LeadKanbanBoard } from '@/components/leads/lead-kanban-board'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLeads, useLeadKpis, useLeadStages, useUpdateLead } from '@/hooks/queries/use-leads'
import { apiFetch } from '@/lib/api/fetch'
import { LEAD_SOURCE, LEAD_TEMPERATURE } from '@/types/enums'
import { format } from 'date-fns'

const sourceColors: Record<string, string> = {
  website: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  referral: 'bg-green-500/10 text-green-700 dark:text-green-300',
  social_media: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  cold_call: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  walk_in: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  linkedin: 'bg-blue-600/10 text-blue-700 dark:text-blue-300',
  reddit: 'bg-orange-600/10 text-orange-700 dark:text-orange-300',
  outlook: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  whatsapp: 'bg-green-600/10 text-green-700 dark:text-green-300',
  email: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  meeting: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  other: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'business_name', header: 'Business Name', cell: ({ row }) => <span className="font-medium">{row.getValue('business_name') as string}</span> },
  { accessorKey: 'contact_person', header: 'Contact Person' },
  { accessorKey: 'contact_no', header: 'Phone' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'source', header: 'Source', cell: ({ row }) => {
    const source = (row.getValue('source') as string) || 'other'
    return <Badge variant="secondary" className={`capitalize ${sourceColors[source] || sourceColors.other}`}>{source.replace(/_/g, ' ')}</Badge>
  }},
  { accessorKey: 'lead_stages', header: 'Stage', cell: ({ row }) => {
    const stage = row.getValue('lead_stages') as Record<string, string> | null
    return stage ? <Badge style={{ backgroundColor: stage.color + '20', color: stage.color }}>{stage.name}</Badge> : '-'
  }},
  { accessorKey: 'temperature', header: 'Temp', cell: ({ row }) => {
    const t = row.getValue('temperature') as string | null
    if (!t) return '-'
    const icon = t === 'hot' ? '🔥' : t === 'warm' ? '☀️' : '❄️'
    return <span className="capitalize">{icon} {t}</span>
  }},
  { accessorKey: 'deal_value', header: 'Deal Value', cell: ({ row }) => {
    const v = row.getValue('deal_value') as number | null
    return v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '-'
  }},
  { accessorKey: 'next_follow_up', header: 'Follow-up', cell: ({ row }) => {
    const d = row.getValue('next_follow_up') as string | null
    if (!d) return '-'
    const isOverdue = new Date(d) < new Date()
    return <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>{format(new Date(d), 'dd MMM')}</span>
  }},
]

interface Stage { id: string; name: string; color: string; sort_order: number; is_active: boolean }

export default function LeadsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [view, setView] = useState<'list' | 'board'>('list')

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>('__all__')
  const [stageFilter, setStageFilter] = useState<string>('__all__')
  const [tempFilter, setTempFilter] = useState<string>('__all__')
  const [followUpFilter, setFollowUpFilter] = useState<string>('__all__')

  // Persist view preference
  useEffect(() => {
    const saved = localStorage.getItem('leads-view')
    if (saved === 'board' || saved === 'list') setView(saved)
  }, [])
  useEffect(() => { localStorage.setItem('leads-view', view) }, [view])

  // Build filter params
  const filterParams: Record<string, string | number | undefined> = {
    page, pageSize: 20, search: search || undefined,
  }
  if (sourceFilter !== '__all__') filterParams.source = sourceFilter
  if (stageFilter !== '__all__') filterParams.stage_id = stageFilter
  if (tempFilter !== '__all__') filterParams.temperature = tempFilter
  if (followUpFilter !== '__all__') {
    const today = new Date()
    if (followUpFilter === 'overdue') {
      filterParams.next_follow_up_before = format(today, 'yyyy-MM-dd')
    } else if (followUpFilter === 'today') {
      filterParams.next_follow_up_before = format(today, 'yyyy-MM-dd')
    } else if (followUpFilter === 'this_week') {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
      filterParams.next_follow_up_before = format(endOfWeek, 'yyyy-MM-dd')
    }
  }

  const { data: leadsData, isLoading } = useLeads(filterParams)
  // For board view, fetch all leads (no pagination)
  const { data: allLeadsData } = useLeads(
    view === 'board' ? { pageSize: 500, search: search || undefined,
      ...(sourceFilter !== '__all__' ? { source: sourceFilter } : {}),
      ...(tempFilter !== '__all__' ? { temperature: tempFilter } : {}),
    } : undefined
  )
  const { data: kpiData } = useLeadKpis()
  const { data: stagesData } = useLeadStages()

  const kpis = kpiData?.data as Record<string, number> | undefined
  const stages = ((stagesData?.data as Stage[]) || []).filter(s => s.is_active)

  async function handleStageChange(leadId: string, newStageId: string) {
    await apiFetch(`/api/v1/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify({ stage_id: newStageId }),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Track and convert potential clients</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5">
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" className="h-8 px-3" onClick={() => setView('list')}>
              <List className="h-4 w-4 mr-1" /> List
            </Button>
            <Button variant={view === 'board' ? 'default' : 'ghost'} size="sm" className="h-8 px-3" onClick={() => setView('board')}>
              <LayoutGrid className="h-4 w-4 mr-1" /> Board
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Leads" value={kpis?.total_leads ?? 0} icon={Users} color="bg-primary" />
        <KpiCard title="Hot Leads" value={kpis?.hot_leads ?? 0} icon={Flame} color="bg-red-500" />
        <KpiCard title="Pipeline Value" value={`₹${((kpis?.pipeline_value ?? 0) / 100000).toFixed(1)}L`} icon={DollarSign} color="bg-green-500" />
        <KpiCard title="Follow-ups Due" value={kpis?.follow_ups_due ?? 0} icon={Clock} color="bg-yellow-500" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Sources</SelectItem>
            {LEAD_SOURCE.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Stages</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tempFilter} onValueChange={setTempFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Temperature" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Temps</SelectItem>
            {LEAD_TEMPERATURE.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Follow-up" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Follow-ups</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="today">Due Today</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === 'list' ? (
        <>
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
        </>
      ) : (
        <LeadKanbanBoard
          leads={((allLeadsData?.data || leadsData?.data) as Record<string, unknown>[])?.map(l => ({
            id: l.id as string,
            business_name: l.business_name as string,
            contact_person: l.contact_person as string | null,
            deal_value: l.deal_value as number | null,
            temperature: l.temperature as string | null,
            next_follow_up: l.next_follow_up as string | null,
            stage_id: l.stage_id as string | null,
            lead_assignees: l.lead_assignees as { employee_id: string; employees: { id: string; name: string } }[] | undefined,
          })) || []}
          stages={stages}
          onStageChange={handleStageChange}
        />
      )}
    </div>
  )
}
