'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Users, Calendar, Unplug, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  useOutlookStatus, useOutlookContacts, useOutlookEmails, useOutlookMeetings,
  useImportOutlookContacts, useImportOutlookMeetings, useDisconnectOutlook,
} from '@/hooks/queries/use-outlook'

export default function OutlookSettingsPage() {
  const { data: statusData, isLoading: statusLoading } = useOutlookStatus()
  const status = statusData?.data as Record<string, unknown> | undefined
  const isConnected = status?.connected === true
  const disconnectMutation = useDisconnectOutlook()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outlook Integration</h1>
          <p className="text-muted-foreground text-sm">Import leads from Outlook contacts, emails, and meetings</p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : isConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{status?.account_name as string}</p>
                  <p className="text-sm text-muted-foreground">{status?.account_email as string}</p>
                </div>
                <Badge variant="default" className="bg-green-600">Connected</Badge>
              </div>
              <Button variant="destructive" size="sm" onClick={() => {
                if (confirm('Disconnect Outlook?')) disconnectMutation.mutate()
              }} disabled={disconnectMutation.isPending}>
                <Unplug className="mr-1 h-4 w-4" /> Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Not connected to Outlook</p>
              <Button onClick={() => { window.location.href = '/api/v1/integrations/outlook/auth' }}>
                <Mail className="mr-2 h-4 w-4" /> Connect Outlook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <>
          <ContactsSection />
          <MeetingsSection />
        </>
      )}
    </div>
  )
}

function ContactsSection() {
  const [browsing, setBrowsing] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const { data, isLoading } = useOutlookContacts(browsing)
  const importMutation = useImportOutlookContacts()
  const contacts = (data?.data || []) as Record<string, unknown>[]

  function toggleSelect(idx: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  function handleImport() {
    const toImport = contacts.filter((_, i) => selected.has(i))
    importMutation.mutate(toImport, {
      onSuccess: (data: any) => {
        toast.success(`Imported ${data?.data?.imported || 0} contacts as leads (${data?.data?.skipped || 0} skipped)`)
        setSelected(new Set())
      },
      onError: (err: Error) => toast.error(err.message),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Contacts</CardTitle>
        <CardDescription>Browse and import Outlook contacts as leads</CardDescription>
      </CardHeader>
      <CardContent>
        {!browsing ? (
          <Button variant="outline" onClick={() => setBrowsing(true)}>Browse Contacts</Button>
        ) : isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{contacts.length} contacts found, {selected.size} selected</p>
              <Button size="sm" disabled={selected.size === 0 || importMutation.isPending} onClick={handleImport}>
                {importMutation.isPending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Importing...</> : `Import ${selected.size} as Leads`}
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {contacts.map((contact, idx) => {
                const emails = (contact.emailAddresses as { address?: string }[]) || []
                return (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer" onClick={() => toggleSelect(idx)}>
                    <Checkbox checked={selected.has(idx)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.displayName as string}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.companyName as string || ''} {emails[0]?.address ? `· ${emails[0].address}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MeetingsSection() {
  const [browsing, setBrowsing] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const { data, isLoading } = useOutlookMeetings(browsing)
  const importMutation = useImportOutlookMeetings()
  const meetings = (data?.data || []) as Record<string, unknown>[]

  function toggleSelect(idx: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  function handleImport() {
    const toImport = meetings.filter((_, i) => selected.has(i))
    importMutation.mutate(toImport, {
      onSuccess: (data: any) => {
        toast.success(`Imported ${data?.data?.imported || 0} leads from meetings (${data?.data?.skipped || 0} skipped)`)
        setSelected(new Set())
      },
      onError: (err: Error) => toast.error(err.message),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Meetings</CardTitle>
        <CardDescription>Create leads from meeting attendees</CardDescription>
      </CardHeader>
      <CardContent>
        {!browsing ? (
          <Button variant="outline" onClick={() => setBrowsing(true)}>Browse Meetings</Button>
        ) : isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{meetings.length} meetings, {selected.size} selected</p>
              <Button size="sm" disabled={selected.size === 0 || importMutation.isPending} onClick={handleImport}>
                {importMutation.isPending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Importing...</> : `Import Attendees`}
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {meetings.map((meeting, idx) => {
                const attendees = (meeting.attendees as { emailAddress?: { name?: string } }[]) || []
                const start = meeting.start as { dateTime?: string } | undefined
                return (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer" onClick={() => toggleSelect(idx)}>
                    <Checkbox checked={selected.has(idx)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meeting.subject as string || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground">
                        {attendees.length} attendees · {start?.dateTime ? new Date(start.dateTime).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
