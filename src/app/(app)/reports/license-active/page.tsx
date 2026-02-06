import { ComingSoon } from '@/components/coming-soon'

export default function ActiveLicenseReportPage() {
  return (
    <ComingSoon
      title="Active Licenses"
      description="View all currently active licenses with renewal dates and compliance status."
      backHref="/reports"
      backLabel="Back to Reports"
    />
  )
}
