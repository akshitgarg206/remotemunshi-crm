import { ComingSoon } from '@/components/coming-soon'

export default function ActiveDscReportPage() {
  return (
    <ComingSoon
      title="Active DSCs"
      description="View all currently active digital signature certificates with expiry dates and holder details."
      backHref="/reports"
      backLabel="Back to Reports"
    />
  )
}
