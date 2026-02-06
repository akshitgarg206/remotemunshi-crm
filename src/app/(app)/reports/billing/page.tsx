import { ComingSoon } from '@/components/coming-soon'

export default function BillingReportPage() {
  return (
    <ComingSoon
      title="Billing Report"
      description="Revenue and billing analysis by client, service, and team member with billable hour breakdowns."
      backHref="/reports"
      backLabel="Back to Reports"
    />
  )
}
