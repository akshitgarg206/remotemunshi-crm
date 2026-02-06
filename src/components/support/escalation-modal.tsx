'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, Minus, Equal, ChevronUp, AlertTriangle } from 'lucide-react'
import { useCreateEscalation } from '@/hooks/queries/use-support-escalations'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const priorities = [
  { value: 'low', label: 'Low', icon: Minus, color: 'text-green-500 border-green-500' },
  { value: 'medium', label: 'Medium', icon: Equal, color: 'text-blue-500 border-blue-500' },
  { value: 'high', label: 'High', icon: ChevronUp, color: 'text-orange-500 border-orange-500' },
  { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'text-red-500 border-red-500' },
] as const

interface EscalationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: string
  ticketNumber?: string
  departments?: Array<{ id: string; name: string }>
}

export function EscalationModal({ open, onOpenChange, ticketId, ticketNumber, departments = [] }: EscalationModalProps) {
  const [departmentId, setDepartmentId] = useState('')
  const [priority, setPriority] = useState<string>('medium')
  const [reason, setReason] = useState('')
  const createEscalation = useCreateEscalation()

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for escalation')
      return
    }

    createEscalation.mutate(
      {
        ticket_id: ticketId,
        to_department_id: departmentId || undefined,
        priority,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Ticket escalated successfully')
          onOpenChange(false)
          setReason('')
          setDepartmentId('')
          setPriority('medium')
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Escalate Ticket {ticketNumber || ''}</DialogTitle>
          <DialogDescription>Assign this ticket to a specialized department</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Department */}
          <div className="space-y-2">
            <Label>Target Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a department..." />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-3 rounded-lg border transition-colors',
                      priority === p.value
                        ? `${p.color} bg-accent`
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Internal Handover Note</Label>
              <span className="text-xs text-amber-500">Visible to internal team only</span>
            </div>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe the reason for escalation, steps already taken, and any relevant customer sentiment..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createEscalation.isPending}
          >
            Confirm Escalation
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
