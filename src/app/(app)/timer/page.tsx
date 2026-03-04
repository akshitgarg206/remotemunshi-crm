'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ACTIVITY_CATEGORY } from '@/types/enums'
import { TimerDisplay } from '@/components/activity-timer/timer-display'
import { CategoryStats } from '@/components/activity-timer/category-stats'
import { ActivityTimeline } from '@/components/activity-timer/activity-timeline'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const categoryLabels: Record<string, string> = {
  operations: 'Operations',
  experiment: 'Experiment',
  marketing: 'Marketing',
  automation: 'Automation',
}

function getISTDate(): string {
  // Get current date in IST
  const now = new Date()
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60 * 1000))
  return format(ist, 'yyyy-MM-dd')
}

export default function TimerPage() {
  const [selectedDate, setSelectedDate] = useState(getISTDate())
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const navigateDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setSelectedDate(format(d, 'yyyy-MM-dd'))
  }

  const isToday = selectedDate === getISTDate()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Timer</h1>
          <p className="text-sm text-muted-foreground">Track your 15-minute productivity blocks</p>
        </div>
      </div>

      {/* Timer + Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex justify-center">
            <TimerDisplay />
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daily Stats</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-7 w-auto text-xs"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(1)} disabled={isToday}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {!isToday && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedDate(getISTDate())}>
                    Today
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CategoryStats date={selectedDate} />
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Activity Timeline</CardTitle>
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 h-6">All</TabsTrigger>
                {ACTIVITY_CATEGORY.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs px-3 h-6">
                    {categoryLabels[cat]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ActivityTimeline
            date={selectedDate}
            categoryFilter={categoryFilter === 'all' ? undefined : categoryFilter}
          />
        </CardContent>
      </Card>
    </div>
  )
}
