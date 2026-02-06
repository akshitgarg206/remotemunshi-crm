'use client'

import { Button } from '@/components/ui/button'
import { Shield, UserCheck, RefreshCw } from 'lucide-react'
import { useTakeoverConversation } from '@/hooks/queries/use-support-conversations'
import { useUpdateEscalation } from '@/hooks/queries/use-support-escalations'
import { toast } from 'sonner'

interface SupervisorToolbarProps {
  conversationId: string
  escalationId?: string
  onReassign?: () => void
}

export function SupervisorToolbar({ conversationId, escalationId, onReassign }: SupervisorToolbarProps) {
  const takeover = useTakeoverConversation()
  const updateEscalation = useUpdateEscalation()

  const handleTakeOver = () => {
    takeover.mutate(conversationId, {
      onSuccess: () => toast.success('You have taken over this conversation'),
      onError: (err) => toast.error(err.message),
    })
  }

  const handleResolve = () => {
    if (!escalationId) return
    updateEscalation.mutate(
      { id: escalationId, data: { status: 'resolved' } },
      {
        onSuccess: () => toast.success('Escalation resolved'),
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <div className="flex items-center gap-2 p-3 border-t bg-muted/50">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTakeOver}
        disabled={takeover.isPending}
      >
        <Shield className="h-3.5 w-3.5 mr-1.5" />
        Take Over
      </Button>
      {onReassign && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReassign}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Re-assign
        </Button>
      )}
      {escalationId && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResolve}
          disabled={updateEscalation.isPending}
          className="border-green-700/40 text-green-400 hover:bg-green-900/20 ml-auto"
        >
          <UserCheck className="h-3.5 w-3.5 mr-1.5" />
          Resolve
        </Button>
      )}
    </div>
  )
}
