'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface LogCommunicationDialogProps {
  clientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'in_person', label: 'In Person' },
  { value: 'sms', label: 'SMS' },
] as const

type Channel = (typeof CHANNELS)[number]['value']
type Direction = 'inbound' | 'outbound'

function nowLocalISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function LogCommunicationDialog({
  clientId,
  open,
  onOpenChange,
}: LogCommunicationDialogProps) {
  const queryClient = useQueryClient()

  const [channel, setChannel] = useState<Channel>('email')
  const [direction, setDirection] = useState<Direction>('outbound')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [fromContact, setFromContact] = useState('')
  const [toContact, setToContact] = useState('')
  const [sentAt, setSentAt] = useState(nowLocalISO())

  function resetForm() {
    setChannel('email')
    setDirection('outbound')
    setSubject('')
    setBody('')
    setFromContact('')
    setToContact('')
    setSentAt(nowLocalISO())
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/clients/${clientId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          direction,
          subject: subject || undefined,
          body: body || undefined,
          from_contact: fromContact || undefined,
          to_contact: toContact || undefined,
          sent_at: sentAt ? new Date(sentAt).toISOString() : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Failed to log communication')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Communication logged')
      queryClient.invalidateQueries({ queryKey: ['communications', clientId] })
      resetForm()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Communication</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-4"
        >
          {/* Channel */}
          <div className="space-y-2">
            <Label>Channel</Label>
            <div className="flex gap-1 flex-wrap">
              {CHANNELS.map((ch) => (
                <Button
                  key={ch.value}
                  type="button"
                  variant={channel === ch.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChannel(ch.value)}
                >
                  {ch.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div className="space-y-2">
            <Label>Direction</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={direction === 'outbound' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDirection('outbound')}
              >
                Outbound
              </Button>
              <Button
                type="button"
                variant={direction === 'inbound' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDirection('inbound')}
              >
                Inbound
              </Button>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="comm-subject">Subject</Label>
            <Input
              id="comm-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Communication subject"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="comm-body">Body</Label>
            <Textarea
              id="comm-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notes or message content"
              rows={3}
            />
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comm-from">From</Label>
              <Input
                id="comm-from"
                value={fromContact}
                onChange={(e) => setFromContact(e.target.value)}
                placeholder="From contact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comm-to">To</Label>
              <Input
                id="comm-to"
                value={toContact}
                onChange={(e) => setToContact(e.target.value)}
                placeholder="To contact"
              />
            </div>
          </div>

          {/* Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="comm-sent-at">Date & Time</Label>
            <Input
              id="comm-sent-at"
              type="datetime-local"
              value={sentAt}
              onChange={(e) => setSentAt(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Logging...' : 'Log Communication'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
