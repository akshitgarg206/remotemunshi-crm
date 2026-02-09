'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, AlertTriangle, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useComplianceMatrix } from '@/hooks/queries/use-compliance-matrix'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DeadlineDrawer } from './deadline-drawer'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ClientViewProps {
  clientId: string
  year: string
}

const monthLabels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'filed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-500" />
    case 'data_received':
      return <Clock className="h-4 w-4 text-green-400" />
    case 'data_pending':
      return <MinusCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-400" />
  }
}

export function ClientView({ clientId, year }: ClientViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDeadline, setSelectedDeadline] = useState<any>(null)

  const fy = Number(year)
  const periodStart = `${fy}-04-01`
  const periodEnd = `${fy + 1}-03-31`

  const monthKeys = [
    `${fy}-04`, `${fy}-05`, `${fy}-06`, `${fy}-07`, `${fy}-08`, `${fy}-09`,
    `${fy}-10`, `${fy}-11`, `${fy}-12`, `${fy + 1}-01`, `${fy + 1}-02`, `${fy + 1}-03`,
  ]

  const { data, isLoading } = useComplianceMatrix(
    clientId ? { view: 'client', client_id: clientId, period_start: periodStart, period_end: periodEnd } : undefined
  )

  if (!clientId) {
    return <p className="text-muted-foreground text-center py-12">Select a client to view their compliance status across all services.</p>
  }

  const rows = (data?.data || []) as any[]

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No deadlines found for this client in FY {fy}-{fy + 1}.</p>
  }

  const handleCellClick = (deadline: any) => {
    setSelectedDeadline(deadline)
    setDrawerOpen(true)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Service</TableHead>
              {monthLabels.map((label, i) => (
                <TableHead key={i} className="text-center min-w-[60px]">{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row: any) => {
              // Map deadlines by month key
              const deadlineMap: Record<string, any> = {}
              for (const d of (row.deadlines || [])) {
                const mk = d.period_start?.substring(0, 7)
                if (mk) deadlineMap[mk] = d
              }

              return (
                <TableRow key={row.service_id}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium">{row.service_name}</TableCell>
                  {monthKeys.map((mk) => {
                    const dl = deadlineMap[mk]
                    if (!dl) return <TableCell key={mk} className="text-center text-muted-foreground text-xs">-</TableCell>

                    const isOverdue = dl.due_date && new Date(dl.due_date) < new Date() && dl.status !== 'filed'

                    return (
                      <TableCell key={mk} className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleCellClick(dl)}
                              className={cn(
                                'inline-flex items-center justify-center rounded p-1 hover:bg-muted transition-colors',
                                isOverdue && 'bg-red-50 dark:bg-red-900/20'
                              )}
                            >
                              <StatusIcon status={dl.status} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{(dl.status || '').replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">{dl.period_label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <DeadlineDrawer open={drawerOpen} onOpenChange={setDrawerOpen} deadline={selectedDeadline} />
    </TooltipProvider>
  )
}
