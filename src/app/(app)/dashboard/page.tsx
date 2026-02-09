'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { format } from 'date-fns'
import {
  CheckSquare, Clock, AlertTriangle, Users, Activity,
  CalendarClock, FileCheck, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'

export default function DashboardPage() {
  const { data: taskKpis, isLoading: tasksLoading } = useQuery({
    queryKey: ['task-summary'],
    queryFn: () => apiFetch('/api/v1/tasks/summary'),
  })

  const { data: deadlineKpis, isLoading: deadlinesLoading } = useQuery({
    queryKey: ['deadline-kpis'],
    queryFn: () => apiFetch('/api/v1/deadlines/kpis'),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentTasks } = useQuery({
    queryKey: ['recent-tasks'],
    queryFn: () => apiFetch<any[]>('/api/v1/tasks?limit=5&sort=updated_at&order=desc'),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upcomingDeadlines } = useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: () => apiFetch<any[]>('/api/v1/deadlines?limit=5&sort=due_date&order=asc&status=data_pending,data_received,in_progress'),
  })

  const kpis = (taskKpis?.data || {}) as Record<string, number>
  const dKpis = (deadlineKpis?.data || {}) as Record<string, number>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Here&#39;s what&#39;s happening across your practice</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tasksLoading || deadlinesLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KpiCard
              title="Tasks Due Today"
              value={kpis.due_today ?? 0}
              subtitle="Requires attention"
              icon={CheckSquare}
              color="bg-primary"
            />
            <KpiCard
              title="Pending Compliance"
              value={dKpis.data_pending ?? 0}
              subtitle="Awaiting data"
              icon={CalendarClock}
              color="bg-yellow-500"
            />
            <KpiCard
              title="Overdue Items"
              value={(kpis.overdue ?? 0) + (dKpis.overdue ?? 0)}
              subtitle="Tasks + deadlines"
              icon={AlertTriangle}
              color="bg-red-500"
            />
            <KpiCard
              title="Completed This Week"
              value={kpis.completed_this_week ?? 0}
              subtitle="Keep it up"
              icon={FileCheck}
              color="bg-green-500"
            />
          </>
        )}
      </div>

      {/* Two-Column: Recent Activity + Upcoming Deadlines */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Link href="/task">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!recentTasks?.data?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.data.slice(0, 5).map((task: any) => (
                  <Link
                    key={task.id}
                    href={`/task/${task.id}`}
                    className="flex items-start gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.client_name && (
                          <span className="text-xs text-muted-foreground truncate">{task.client_name}</span>
                        )}
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
            <Link href="/data-tracker">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!upcomingDeadlines?.data?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CalendarClock className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.data.slice(0, 5).map((dl: any) => {
                  const dueDate = new Date(dl.due_date)
                  const now = new Date()
                  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  const urgency = daysLeft < 0 ? 'text-red-600 dark:text-red-400' : daysLeft <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'

                  return (
                    <Link
                      key={dl.id}
                      href={`/data-tracker/${dl.id}`}
                      className="flex items-start gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5">
                        <CalendarClock className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{dl.service_name || 'Service'} &middot; {dl.period}</p>
                        <p className="text-xs text-muted-foreground truncate">{dl.client_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-medium ${urgency}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(dueDate, 'MMM d')}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/task/add">
              <Button variant="outline" size="sm" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                New Task
              </Button>
            </Link>
            <Link href="/client?action=add">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Add Client
              </Button>
            </Link>
            <Link href="/leads?action=add">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Add Lead
              </Button>
            </Link>
            <Link href="/compliance-matrix">
              <Button variant="outline" size="sm" className="gap-2">
                <FileCheck className="h-4 w-4" />
                Compliance Matrix
              </Button>
            </Link>
            <Link href="/data-tracker">
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarClock className="h-4 w-4" />
                Data Tracker
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
