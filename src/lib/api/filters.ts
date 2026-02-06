import { NextRequest } from 'next/server'

export function parseFilters(req: NextRequest, allowedFilters: string[]): Record<string, string> {
  const filters: Record<string, string> = {}
  const searchParams = req.nextUrl.searchParams

  for (const key of allowedFilters) {
    const value = searchParams.get(key)
    if (value !== null && value !== '') {
      filters[key] = value
    }
  }

  return filters
}
