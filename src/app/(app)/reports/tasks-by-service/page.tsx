import { ComingSoon } from '@/components/coming-soon'

export default function TasksByServiceReportPage() {
  return (
    <ComingSoon
      title="Tasks by Service"
      description="Service-level task analysis showing effort distribution and completion metrics per service type."
      backHref="/reports"
      backLabel="Back to Reports"
    />
  )
}
