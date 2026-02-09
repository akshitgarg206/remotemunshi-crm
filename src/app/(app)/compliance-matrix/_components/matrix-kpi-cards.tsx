'use client'

import { TrendingUp, AlertTriangle, XCircle, PieChart } from 'lucide-react'
import { KpiCard } from '@/components/kpi-cards/kpi-card'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MatrixKpiCardsProps {
  data: any
  isLoading: boolean
}

export function MatrixKpiCards({ data, isLoading }: MatrixKpiCardsProps) {
  const kpis = data?.data as Record<string, number> | undefined

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="On Track"
        value={isLoading ? '...' : kpis?.on_track ?? 0}
        icon={TrendingUp}
        color="bg-green-500"
        subtitle="Filed or in progress within deadline"
      />
      <KpiCard
        title="At Risk"
        value={isLoading ? '...' : kpis?.at_risk ?? 0}
        icon={AlertTriangle}
        color="bg-yellow-500"
        subtitle="Due within 7 days, not yet filed"
      />
      <KpiCard
        title="Overdue"
        value={isLoading ? '...' : kpis?.overdue ?? 0}
        icon={XCircle}
        color="bg-red-500"
        subtitle="Past due date, not filed"
      />
      <KpiCard
        title="Completion Rate"
        value={isLoading ? '...' : `${kpis?.completion_rate ?? 0}%`}
        icon={PieChart}
        color="bg-primary"
        subtitle={`${kpis?.filed ?? 0} of ${kpis?.total ?? 0} filed`}
      />
    </div>
  )
}
