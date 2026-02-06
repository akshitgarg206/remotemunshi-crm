import { ComingSoon } from '@/components/coming-soon'

export default function TasksByClientReportPage() {
  return (
    <ComingSoon
      title="Tasks by Client"
      description="Breakdown of tasks grouped by client with status distribution and time spent."
      backHref="/reports"
      backLabel="Back to Reports"
    />
  )
}
