import { NextRequest } from 'next/server'

export interface PaginationOptions {
  defaultPageSize?: number
  maxPageSize?: number
}

export interface ParsedPagination {
  page: number
  pageSize: number
  offset: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
  search: string
}

export function parsePagination(
  req: NextRequest,
  options: PaginationOptions = {}
): ParsedPagination {
  const { defaultPageSize = 20, maxPageSize = 100 } = options
  const searchParams = req.nextUrl.searchParams

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10))
  )
  const offset = (page - 1) * pageSize
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
  const search = searchParams.get('search') || ''

  return { page, pageSize, offset, sortBy, sortOrder, search }
}

export function paginationMeta(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}
