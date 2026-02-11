'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, FileWarning, Pencil, Building2, Calendar, Scale, BookOpen, MessageSquare, ExternalLink, Paperclip } from 'lucide-react'
import { apiFetch } from '@/lib/api/fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ notice_type: '', section: '', assessment_year: '', received_date: '', due_date: '', hearing_date: '', status: 'open', remarks: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['notices', id],
    queryFn: () => apiFetch(`/api/v1/notices/${id}`),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/notices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices', id] })
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      toast.success('Notice updated')
      setEditOpen(false)
    },
    onError: () => toast.error('Failed to update notice'),
  })

  function openEditDialog() {
    const n = data?.data as Record<string, unknown>
    if (!n) return
    setEditForm({
      notice_type: (n.notice_type as string) || '',
      section: (n.section as string) || '',
      assessment_year: (n.assessment_year as string) || '',
      received_date: (n.received_date as string)?.split('T')[0] || '',
      due_date: (n.due_date as string)?.split('T')[0] || '',
      hearing_date: (n.hearing_date as string)?.split('T')[0] || '',
      status: (n.status as string) || 'open',
      remarks: (n.remarks as string) || '',
    })
    setEditOpen(true)
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate({
      notice_type: editForm.notice_type || undefined,
      section: editForm.section || undefined,
      assessment_year: editForm.assessment_year || undefined,
      received_date: editForm.received_date || undefined,
      due_date: editForm.due_date || undefined,
      hearing_date: editForm.hearing_date || undefined,
      status: editForm.status,
      remarks: editForm.remarks || undefined,
    })
  }

  if (isLoading) return <DetailSkeleton />

  const notice = data?.data as Record<string, unknown> | undefined
  if (!notice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Notice not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/notice-management')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notices
        </Button>
      </div>
    )
  }

  const noticeType = notice.notice_type as string
  const status = notice.status as string
  const client = notice.clients as Record<string, string> | null
  const taskId = notice.task_id as string | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/notice-management')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{noticeType}</h1>
            <p className="text-sm text-muted-foreground">{client?.business_name || 'Notice'}</p>
          </div>
          <Badge variant="secondary" className={statusColors[status] || ''}>
            {status?.replace(/_/g, ' ')}
          </Badge>
        </div>
        <Button onClick={openEditDialog}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5" /> Notice Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0">
              <div className="space-y-0 divide-y">
                <InfoRow icon={Building2} label="Client" value={client?.business_name} />
                <InfoRow icon={FileWarning} label="Notice Type" value={noticeType} />
                <InfoRow icon={Scale} label="Section" value={notice.section as string} />
                <InfoRow icon={BookOpen} label="Assessment Year" value={notice.assessment_year as string} />
                <InfoRow
                  icon={Calendar}
                  label="Received Date"
                  value={notice.received_date ? format(new Date(notice.received_date as string), 'dd MMM yyyy') : '-'}
                />
              </div>
              <div className="space-y-0 divide-y sm:pl-6">
                <InfoRow
                  icon={Calendar}
                  label="Due Date"
                  value={notice.due_date ? format(new Date(notice.due_date as string), 'dd MMM yyyy') : '-'}
                />
                <InfoRow
                  icon={Calendar}
                  label="Hearing Date"
                  value={notice.hearing_date ? format(new Date(notice.hearing_date as string), 'dd MMM yyyy') : '-'}
                />
                <InfoRow
                  icon={FileWarning}
                  label="Status"
                  value={
                    <Badge variant="secondary" className={statusColors[status] || ''}>
                      {status?.replace(/_/g, ' ')}
                    </Badge>
                  }
                />
                <InfoRow icon={MessageSquare} label="Remarks" value={notice.remarks as string} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Cards */}
        <div className="space-y-4">
          {/* Linked Task */}
          {taskId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" /> Linked Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/task/${taskId}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> View Linked Task
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Attachments Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" /> Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Paperclip className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No attachments</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Notice Type</Label>
                <Input value={editForm.notice_type} onChange={(e) => setEditForm({ ...editForm, notice_type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input value={editForm.section} onChange={(e) => setEditForm({ ...editForm, section: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Assessment Year</Label>
                <Input value={editForm.assessment_year} onChange={(e) => setEditForm({ ...editForm, assessment_year: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Received Date</Label>
                <Input type="date" value={editForm.received_date} onChange={(e) => setEditForm({ ...editForm, received_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hearing Date</Label>
                <Input type="date" value={editForm.hearing_date} onChange={(e) => setEditForm({ ...editForm, hearing_date: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Remarks</Label>
                <Textarea value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
