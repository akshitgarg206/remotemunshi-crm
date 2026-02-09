import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Users, CheckSquare, FileKey, Award, ChevronRight } from 'lucide-react'

const reportCategories = [
  {
    title: 'Team Reports',
    description: 'Attendance, timesheets, performance, and stipend tracking',
    icon: Users,
    color: 'bg-primary/10 text-primary',
    reports: [
      { label: 'Attendance Report', href: '/reports/attendance', description: 'Daily attendance logs' },
      { label: 'Timesheet Report', href: '/reports/timesheet', description: 'Hours tracked by team' },
      { label: 'Performance Report', href: '/reports/performance', description: 'Team productivity metrics' },
      { label: 'Stipend Report', href: '/reports/stipend', description: 'Stipend calculations' },
    ],
  },
  {
    title: 'Task Reports',
    description: 'Task analysis by client, user, and service',
    icon: CheckSquare,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    reports: [
      { label: 'Tasks by Client', href: '/reports/tasks-by-client', description: 'Task distribution per client' },
      { label: 'Tasks by User', href: '/reports/tasks-by-user', description: 'Workload per team member' },
      { label: 'Tasks by Service', href: '/reports/tasks-by-service', description: 'Tasks grouped by service' },
      { label: 'Billing Report', href: '/reports/billing', description: 'Revenue and billing summary' },
      { label: 'Full Task Report', href: '/reports/tasks-full', description: 'Comprehensive task export' },
    ],
  },
  {
    title: 'DSC Reports',
    description: 'Digital signature certificate tracking',
    icon: FileKey,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    reports: [
      { label: 'Active DSCs', href: '/reports/dsc-active', description: 'Currently valid certificates' },
      { label: 'Expired DSCs', href: '/reports/dsc-expired', description: 'Certificates past expiry' },
      { label: 'DSCs by Location', href: '/reports/dsc-by-location', description: 'Geographic distribution' },
    ],
  },
  {
    title: 'License Reports',
    description: 'Business license and registration tracking',
    icon: Award,
    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    reports: [
      { label: 'Active Licenses', href: '/reports/license-active', description: 'Currently valid licenses' },
      { label: 'Expired Licenses', href: '/reports/license-expired', description: 'Licenses past expiry' },
    ],
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Analytics and reporting across all modules</p>
      </div>

      {reportCategories.map((cat) => {
        const Icon = cat.icon
        return (
          <div key={cat.title} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cat.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">{cat.title}</h2>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {cat.reports.map((report) => (
                <Link key={report.href} href={report.href}>
                  <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full group">
                    <CardContent className="flex items-center gap-3 p-4">
                      <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{report.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
