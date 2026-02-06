import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Users, CheckSquare, FileKey, Award } from 'lucide-react'

const reportCategories = [
  {
    title: 'Team Reports',
    icon: Users,
    color: 'bg-primary/10 text-primary',
    reports: [
      { label: 'Attendance Report', href: '/reports/attendance' },
      { label: 'Timesheet Report', href: '/reports/timesheet' },
      { label: 'Performance Report', href: '/reports/performance' },
      { label: 'Stipend Report', href: '/reports/stipend' },
    ],
  },
  {
    title: 'Task Reports',
    icon: CheckSquare,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    reports: [
      { label: 'Tasks by Client', href: '/reports/tasks-by-client' },
      { label: 'Tasks by User', href: '/reports/tasks-by-user' },
      { label: 'Tasks by Service', href: '/reports/tasks-by-service' },
      { label: 'Billing Report', href: '/reports/billing' },
      { label: 'Full Task Report', href: '/reports/tasks-full' },
    ],
  },
  {
    title: 'DSC Reports',
    icon: FileKey,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    reports: [
      { label: 'Active DSCs', href: '/reports/dsc-active' },
      { label: 'Expired DSCs', href: '/reports/dsc-expired' },
      { label: 'DSCs by Location', href: '/reports/dsc-by-location' },
    ],
  },
  {
    title: 'License Reports',
    icon: Award,
    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    reports: [
      { label: 'Active Licenses', href: '/reports/license-active' },
      { label: 'Expired Licenses', href: '/reports/license-expired' },
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
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold">{cat.title}</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cat.reports.map((report) => (
                <Link key={report.href} href={report.href}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{report.label}</span>
                      </div>
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
