'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Linkedin, Upload, FileSpreadsheet, ExternalLink, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CsvImporter } from '@/components/csv-import/csv-importer'

export default function LinkedInSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LinkedIn Integration</h1>
          <p className="text-muted-foreground text-sm">Import LinkedIn connections as leads</p>
        </div>
      </div>

      {/* CSV Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Import from CSV</CardTitle>
          <CardDescription>Import your LinkedIn connections from an exported CSV file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-300">How to export your LinkedIn connections:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-400">
                  <li>Go to LinkedIn &gt; Settings &amp; Privacy</li>
                  <li>Click &quot;Data privacy&quot; in the left menu</li>
                  <li>Click &quot;Get a copy of your data&quot;</li>
                  <li>Select &quot;Connections&quot; and click &quot;Request archive&quot;</li>
                  <li>LinkedIn will email you a download link (may take a few minutes)</li>
                  <li>Download the ZIP, extract, and upload the <code>Connections.csv</code> file below</li>
                </ol>
              </div>
            </div>
          </div>

          <CsvImporter
            module="linkedin_connections"
            onImport={() => {
              toast.success('LinkedIn connections imported as leads')
            }}
          />
        </CardContent>
      </Card>

      {/* API Integration Section (Coming Soon) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5" /> API Integration
            <Badge variant="secondary">Coming Soon</Badge>
          </CardTitle>
          <CardDescription>Direct LinkedIn API access for automated lead import</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
            <Linkedin className="h-10 w-10 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">LinkedIn API integration requires partner approval</p>
              <p className="text-xs text-muted-foreground mt-1">
                Direct API access to LinkedIn data requires approval through the LinkedIn Marketing Developer Platform.
                For now, use the CSV export method above.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://developer.linkedin.com/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> LinkedIn Developer Portal
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
