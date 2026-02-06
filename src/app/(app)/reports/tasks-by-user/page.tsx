import { ComingSoon } from '@/components/coming-soon'

export default function TasksByUserReportPage() {
  return (
    <ComingSoon
      title="Tasks by User"
      description="Individual workload analysis showing task assignments, completion rates, and overdue items per team member."
      backHref="/reports"
      backLabel="Back to Reports"
    />
  )
}
