'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Save } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'

interface DayConfig {
  day: string
  label: string
  start_time: string
  end_time: string
  is_working: boolean
}

const defaultDays: DayConfig[] = [
  { day: 'monday', label: 'Monday', start_time: '09:00', end_time: '18:00', is_working: true },
  { day: 'tuesday', label: 'Tuesday', start_time: '09:00', end_time: '18:00', is_working: true },
  { day: 'wednesday', label: 'Wednesday', start_time: '09:00', end_time: '18:00', is_working: true },
  { day: 'thursday', label: 'Thursday', start_time: '09:00', end_time: '18:00', is_working: true },
  { day: 'friday', label: 'Friday', start_time: '09:00', end_time: '18:00', is_working: true },
  { day: 'saturday', label: 'Saturday', start_time: '09:00', end_time: '14:00', is_working: true },
]

export default function BusinessHoursPage() {
  const [days, setDays] = useState<DayConfig[]>(defaultDays)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['business-hours'],
    queryFn: () => apiFetch<DayConfig[]>('/api/v1/settings/business-hours'),
  })

  useEffect(() => {
    if (data?.data && Array.isArray(data.data)) {
      setDays(data.data)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (d: DayConfig[]) =>
      apiFetch('/api/v1/settings/business-hours', { method: 'PUT', body: JSON.stringify({ days: d }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-hours'] })
      toast.success('Business hours saved')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function updateDay(index: number, field: keyof DayConfig, value: string | boolean) {
    setDays((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveMutation.mutate(days)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Hours</h1>
          <p className="text-muted-foreground">Configure your working days and hours</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Header row */}
                <div className="grid grid-cols-[200px_1fr_1fr_80px] gap-4 items-center px-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Day</Label>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Time</Label>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Time</Label>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Working</Label>
                </div>

                {days.map((day, index) => (
                  <div
                    key={day.day}
                    className={`grid grid-cols-[200px_1fr_1fr_80px] gap-4 items-center rounded-lg border p-3 transition-colors ${
                      day.is_working ? 'bg-background' : 'bg-muted/50 opacity-60'
                    }`}
                  >
                    <div className="font-medium">{day.label}</div>
                    <Input
                      type="time"
                      value={day.start_time}
                      onChange={(e) => updateDay(index, 'start_time', e.target.value)}
                      disabled={!day.is_working}
                    />
                    <Input
                      type="time"
                      value={day.end_time}
                      onChange={(e) => updateDay(index, 'end_time', e.target.value)}
                      disabled={!day.is_working}
                    />
                    <div className="flex justify-center">
                      <Checkbox
                        checked={day.is_working}
                        onCheckedChange={(checked) => updateDay(index, 'is_working', checked === true)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? 'Saving...' : 'Save Business Hours'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
