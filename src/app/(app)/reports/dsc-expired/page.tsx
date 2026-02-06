import { ComingSoon } from '@/components/coming-soon'

export default function ExpiredDscReportPage() {
  return (
    <ComingSoon
      title="Expired DSCs"
      description="Track expired and soon-to-expire digital signature certificates for timely renewal."
      backHref="/reports"
      backLabel="Back to Reports"
    />
  )
}
