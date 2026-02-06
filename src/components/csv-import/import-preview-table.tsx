'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ImportPreviewTableProps {
  errors: Array<{ row: number; field: string; message: string }>
  total: number
  valid: number
}

export function ImportPreviewTable({ errors, total, valid }: ImportPreviewTableProps) {
  return (
    <div className="space-y-3">
      {/* Summary Badges */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{total} Total</Badge>
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {valid} Valid
        </Badge>
        {errors.length > 0 && (
          <Badge variant="destructive">{errors.length} Errors</Badge>
        )}
      </div>

      {/* Error Table */}
      {errors.length > 0 && (
        <div className="max-h-48 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Row #</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">{error.row}</TableCell>
                  <TableCell className="text-sm">{error.field}</TableCell>
                  <TableCell className="text-sm text-red-600">{error.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
