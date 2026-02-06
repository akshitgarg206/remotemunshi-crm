import { ComingSoon } from '@/components/coming-soon'

export default function ExpiredLicenseReportPage() {
  return (
    <ComingSoon
      title="Expired Licenses"
      description="Track expired and soon-to-expire licenses requiring renewal action."
      backHref="/reports"
      backLabel="Back to Reports"
    />
  )
}
