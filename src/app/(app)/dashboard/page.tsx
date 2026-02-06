import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckSquare, Clock, Users } from 'lucide-react'

function KpiCard({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Remote Munshi CRM</p>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total Tasks" value={0} subtitle="All assigned tasks" icon={CheckSquare} color="bg-primary" />
            <KpiCard title="In Progress" value={0} subtitle="Currently working" icon={Clock} color="bg-yellow-500" />
            <KpiCard title="Overdue" value={0} subtitle="Past due date" icon={CheckSquare} color="bg-red-500" />
            <KpiCard title="Completed Today" value={0} subtitle="Finished today" icon={CheckSquare} color="bg-green-500" />
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Present Today" value={0} icon={Users} color="bg-green-500" />
            <KpiCard title="On Leave" value={0} icon={Users} color="bg-yellow-500" />
            <KpiCard title="Late Arrivals" value={0} icon={Clock} color="bg-red-500" />
            <KpiCard title="Avg Hours" value="0h" icon={Clock} color="bg-primary" />
          </div>
        </TabsContent>

        <TabsContent value="timesheet" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Today's Hours" value="0h" icon={Clock} color="bg-primary" />
            <KpiCard title="This Week" value="0h" icon={Clock} color="bg-purple-500" />
            <KpiCard title="Billable Hours" value="0h" icon={Clock} color="bg-green-500" />
            <KpiCard title="Clients Worked" value={0} icon={Users} color="bg-yellow-500" />
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
