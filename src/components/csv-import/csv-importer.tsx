'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, Download, CheckCircle, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ImportPreviewTable } from './import-preview-table'

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{ row: number; field: string; message: string }>
}

interface CsvImporterProps {
  module: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onComplete?: () => void
}

export function CsvImporter({ module, open: controlledOpen, onOpenChange, onComplete }: CsvImporterProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const validateMutation = useMutation({
    mutationFn: async (csvFile: File) => {
      const formData = new FormData()
      formData.append('file', csvFile)

      const res = await fetch(`/api/v1/import/${module}?validate=true`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Validation failed')
      return json.data as ImportResult
    },
    onSuccess: (data) => {
      setPreview(data)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const importMutation = useMutation({
    mutationFn: async (csvFile: File) => {
      const formData = new FormData()
      formData.append('file', csvFile)

      const res = await fetch(`/api/v1/import/${module}`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Import failed')
      return json.data as ImportResult
    },
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.success} rows`)
      queryClient.invalidateQueries({ queryKey: [module] })
      setOpen(false)
      setPreview(null)
      setFile(null)
      onComplete?.()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setPreview(null)
    validateMutation.mutate(selectedFile)
  }

  function handleImport() {
    if (!file) return
    importMutation.mutate(file)
  }

  function handleClose() {
    setOpen(false)
    setPreview(null)
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      {controlledOpen === undefined && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import {module}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Download Template */}
            <div>
              <a
                href={`/api/v1/import/${module}/template`}
                download
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Download CSV Template
              </a>
            </div>

            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
            </div>

            {/* Loading State */}
            {validateMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Validating CSV...
              </div>
            )}

            {/* Preview Results */}
            {preview && (
              <div className="space-y-3">
                <ImportPreviewTable
                  errors={preview.errors}
                  total={preview.total}
                  valid={preview.success}
                />

                {/* Import Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    {preview.success > 0 ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{preview.success} rows ready to import</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span>No valid rows to import</span>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={preview.success === 0 || importMutation.isPending}
                  >
                    {importMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Importing...
                      </>
                    ) : (
                      `Import ${preview.success} Valid Rows`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
