'use client'

import { cn } from '@/lib/utils'
import { useComplianceMatrix } from '@/hooks/queries/use-compliance-matrix'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PeriodViewProps {
  year: string
}

const monthLabels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

function cellColor(filed: number, total: number): string {
  if (total === 0) return ''
  const pct = (filed / total) * 100
  if (pct === 100) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  if (pct >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
  return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
}

export function PeriodView({ year }: PeriodViewProps) {
  const fy = Number(year)
  const periodStart = `${fy}-04-01`
  const periodEnd = `${fy + 1}-03-31`

  // Financial year months: Apr(YYYY) ... Dec(YYYY), Jan(YYYY+1) ... Mar(YYYY+1)
  const monthKeys = [
    `${fy}-04`, `${fy}-05`, `${fy}-06`, `${fy}-07`, `${fy}-08`, `${fy}-09`,
    `${fy}-10`, `${fy}-11`, `${fy}-12`, `${fy + 1}-01`, `${fy + 1}-02`, `${fy + 1}-03`,
  ]

  const { data, isLoading } = useComplianceMatrix({
    view: 'period',
    period_start: periodStart,
    period_end: periodEnd,
  })

  const rows = (data?.data || []) as any[]

  // Compute summary row
  const summary: Record<string, { filed: number; total: number; overdue: number }> = {}
  for (const mk of monthKeys) summary[mk] = { filed: 0, total: 0, overdue: 0 }
  for (const row of rows) {
    for (const m of (row.months || [])) {
      if (summary[m.month]) {
        summary[m.month].filed += m.filed
        summary[m.month].total += m.total
        summary[m.month].overdue += m.overdue
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No deadline data found for FY {fy}-{fy + 1}.</p>
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Service</TableHead>
            {monthLabels.map((label, i) => (
              <TableHead key={i} className="text-center min-w-[70px]">{label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row: any) => {
            const monthMap: Record<string, any> = {}
            for (const m of (row.months || [])) monthMap[m.month] = m

            return (
              <TableRow key={row.service_id}>
                <TableCell className="sticky left-0 bg-background z-10 font-medium">{row.service_name}</TableCell>
                {monthKeys.map((mk) => {
                  const cell = monthMap[mk]
                  if (!cell) return <TableCell key={mk} className="text-center text-muted-foreground text-xs">-</TableCell>
                  return (
                    <TableCell key={mk} className={cn('text-center text-xs font-medium', cellColor(cell.filed, cell.total))}>
                      {cell.filed}/{cell.total}
                      {cell.overdue > 0 && (
                        <span className="block text-[10px] text-red-600 dark:text-red-400">{cell.overdue} late</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}

          {/* Summary row */}
          <TableRow className="border-t-2 font-semibold">
            <TableCell className="sticky left-0 bg-background z-10">Total</TableCell>
            {monthKeys.map((mk) => {
              const s = summary[mk]
              return (
                <TableCell key={mk} className={cn('text-center text-xs', cellColor(s.filed, s.total))}>
                  {s.total > 0 ? `${s.filed}/${s.total}` : '-'}
                </TableCell>
              )
            })}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
