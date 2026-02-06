import Link from 'next/link'
import { Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ComingSoonProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
}

export function ComingSoon({
  title,
  description = 'This feature is under development and will be available soon.',
  backHref = '/dashboard',
  backLabel = 'Back to Dashboard',
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <Construction className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      <Link href={backHref}>
        <Button variant="outline">{backLabel}</Button>
      </Link>
    </div>
  )
}
