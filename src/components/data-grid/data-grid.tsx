'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Plus, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'

interface DataGridProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  onAdd?: () => void
  addLabel?: string
  onExport?: () => void
  onImport?: () => void
  onRowClick?: (row: TData) => void
  isLoading?: boolean
  pageCount?: number
  page?: number
  onPageChange?: (page: number) => void
  totalItems?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
}

export function DataGrid<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onSearch,
  onAdd,
  addLabel = 'Add New',
  onExport,
  onImport,
  onRowClick,
  isLoading = false,
  pageCount = 1,
  page = 1,
  onPageChange,
  totalItems,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
}: DataGridProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchValue, setSearchValue] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  const handleSearch = (value: string) => {
    setSearchValue(value)
    onSearch?.(value)
  }

  const hasSearchFilter = searchValue.trim().length > 0
  const isEmpty = !isLoading && data.length === 0

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {onImport && (
            <Button variant="outline" size="sm" onClick={onImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {onAdd && (
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold uppercase tracking-wider">
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'flex items-center gap-1 cursor-pointer select-none'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Content-aware skeleton: varied widths per column
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="flex items-center gap-2">
                        {j === 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                        <Skeleton className={`h-4 ${j === 0 ? 'w-32' : j === columns.length - 1 ? 'w-16' : 'w-24'}`} />
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState
                    variant={hasSearchFilter ? 'no-results' : 'no-data'}
                    title={hasSearchFilter ? 'No results found' : emptyTitle}
                    description={hasSearchFilter ? `No matches for "${searchValue}". Try a different search term.` : emptyDescription}
                    actionLabel={hasSearchFilter ? 'Clear search' : emptyActionLabel}
                    onAction={hasSearchFilter ? () => handleSearch('') : onEmptyAction}
                    className="py-12"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalItems !== undefined && (
              <>
                <span className="font-medium text-foreground">{totalItems}</span> total items
              </>
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {page} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= pageCount}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
