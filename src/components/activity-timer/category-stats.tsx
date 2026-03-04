'use client'

import { useActivityBlockStats } from '@/hooks/queries/use-activity-blocks'
import { KpiCard } from '@/components/kpi-cards/kpi-card'
import { Briefcase, FlaskConical, Megaphone, Bot, Clock } from 'lucide-react'

const categoryConfig = {
  operations: { label: 'Operations', icon: Briefcase, color: 'text-blue-600 dark:text-blue-400' },
  experiment: { label: 'Experiment', icon: FlaskConical, color: 'text-purple-600 dark:text-purple-400' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'text-green-600 dark:text-green-400' },
  automation: { label: 'Automation', icon: Bot, color: 'text-orange-600 dark:text-orange-400' },
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function CategoryStats({ date }: { date: string }) {
  const { data, isLoading } = useActivityBlockStats(date)
  const stats = (data?.data || []) as any[]

  // Aggregate stats
  let totalBlocks = 0
  let totalMinutes = 0
  let missedCount = 0
  const byCategory: Record<string, { blocks: number; minutes: number }> = {}

  for (const row of stats) {
    const blocks = Number(row.block_count) || 0
    const minutes = Number(row.total_minutes) || 0
    const missed = Number(row.missed_count) || 0
    totalBlocks += blocks
    totalMinutes += minutes
    missedCount += missed

    const cat = row.category as string
    if (!byCategory[cat]) byCategory[cat] = { blocks: 0, minutes: 0 }
    byCategory[cat].blocks += blocks
    byCategory[cat].minutes += minutes
  }

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KpiCard
        title="Total Time"
        value={isLoading ? '...' : formatDuration(totalMinutes)}
        icon={Clock}
        subtitle={`${totalBlocks} blocks`}
      />
      {Object.entries(categoryConfig).map(([key, cfg]) => {
        const catStats = byCategory[key]
        return (
          <KpiCard
            key={key}
            title={cfg.label}
            value={isLoading ? '...' : formatDuration(catStats?.minutes || 0)}
            icon={cfg.icon}
            subtitle={`${catStats?.blocks || 0} blocks`}
          />
        )
      })}
      <KpiCard
        title="Missed"
        value={isLoading ? '...' : String(missedCount)}
        icon={Clock}
        subtitle="blocks"
      />
    </div>
  )
}
