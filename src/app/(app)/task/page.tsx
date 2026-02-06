'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { CheckSquare, Clock, AlertTriangle, ListTodo, LayoutGrid, List } from 'lucide-react'
import { DataGrid } from '@/components/data-grid/data-grid'
import { CsvImporter } from '@/components/csv-import/csv-importer'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTasks, useTaskSummary } from '@/hooks/queries/use-tasks'
import { apiFetch } from '@/lib/api/fetch'
import { useQueryClient } from '@tanstack/react-query'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  in_review: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  request_changes: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-300',
  on_hold: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
  medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'task_name', header: 'Task', cell: ({ row }) => <span className="font-medium">{row.getValue('task_name') as string}</span> },
  { accessorKey: 'clients', header: 'Client', cell: ({ row }) => {
    const c = row.getValue('clients') as Record<string, string> | null
    return c?.business_name || '-'
  }},
  { accessorKey: 'services', header: 'Service', cell: ({ row }) => {
    const s = row.getValue('services') as Record<string, string> | null
    return s?.name || '-'
  }},
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const s = row.getValue('status') as string
    return <Badge variant="secondary" className={statusColors[s]}>{s.replace(/_/g, ' ')}</Badge>
  }},
  { accessorKey: 'priority', header: 'Priority', cell: ({ row }) => {
    const p = row.getValue('priority') as string
    return <Badge variant="secondary" className={priorityColors[p]}>{p}</Badge>
  }},
  { accessorKey: 'due_date', header: 'Due Date', cell: ({ row }) => {
    const d = row.getValue('due_date') as string
    return d ? new Date(d).toLocaleDateString('en-IN') : '-'
  }},
]

export default function TasksPage() {
  return (
    <Suspense>
      <TasksPageContent />
    </Suspense>
  )
}

function TasksPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [importOpen, setImportOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'board'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('task-view-mode') as 'list' | 'board') || 'list'
    }
    return 'list'
  })

  // Handle ?view=my_tasks from topbar/mobile-nav links
  useEffect(() => {
    if (searchParams.get('view') === 'my_tasks') {
      setActiveTab('my_tasks')
    }
  }, [searchParams])

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('task-view-mode', viewMode)
  }, [viewMode])

  const statusFilter = !['all', 'my_tasks', 'my_reviews'].includes(activeTab) ? activeTab : undefined
  const myTasks = activeTab === 'my_tasks' ? 'true' : undefined
  const myReviews = activeTab === 'my_reviews' ? 'true' : undefined

  // For board view, fetch larger page to get all visible tasks
  const pageSize = viewMode === 'board' ? 200 : 20

  const { data: tasksData, isLoading } = useTasks({ page: viewMode === 'board' ? 1 : page, pageSize, search, status: statusFilter, my_tasks: myTasks, my_reviews: myReviews })
  const { data: summaryData } = useTaskSummary()
  const summary = (summaryData?.data as Record<string, number>[]) || []
  const totals = summary.reduce((acc, s) => ({
    total: acc.total + (s.total || 0),
    pending: acc.pending + (s.pending || 0),
    in_progress: acc.in_progress + (s.in_progress || 0),
    overdue: acc.overdue + (s.overdue || 0),
  }), { total: 0, pending: 0, in_progress: 0, overdue: 0 })

  async function handleBoardStatusChange(taskId: string, newStatus: string) {
    await apiFetch(`/api/v1/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track all tasks</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-2.5"
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('board')}
            className="h-8 px-2.5"
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Tasks" value={totals.total} icon={ListTodo} color="bg-primary" />
        <KpiCard title="Pending" value={totals.pending} icon={Clock} color="bg-yellow-500" />
        <KpiCard title="In Progress" value={totals.in_progress} icon={CheckSquare} color="bg-purple-500" />
        <KpiCard title="Overdue" value={totals.overdue} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="my_tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="my_reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="in_review">In Review</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'board' ? (
        <KanbanBoard
          tasks={((tasksData?.data as Record<string, unknown>[]) || []) as never[]}
          onStatusChange={handleBoardStatusChange}
        />
      ) : (
        <DataGrid
          columns={columns}
          data={(tasksData?.data as Record<string, unknown>[]) || []}
          isLoading={isLoading}
          searchPlaceholder="Search tasks..."
          onSearch={setSearch}
          onAdd={() => router.push('/task/add')}
          addLabel="Add Task"
          onImport={() => setImportOpen(true)}
          onRowClick={(row) => router.push('/task/' + (row as Record<string, unknown>).id)}
          page={page}
          pageCount={tasksData?.meta?.totalPages || 1}
          totalItems={tasksData?.meta?.total}
          onPageChange={setPage}
        />
      )}

      <CsvImporter module="tasks" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
