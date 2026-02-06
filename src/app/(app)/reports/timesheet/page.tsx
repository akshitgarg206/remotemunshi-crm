import { ComingSoon } from '@/components/coming-soon'

export default function TimesheetReportPage() {
  return (
    <ComingSoon
      title="Timesheet Report"
      description="Analyze billable and non-billable hours logged by team members across clients and services."
      backHref="/reports"
      backLabel="Back to Reports"
    />
  )
}
