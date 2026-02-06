'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { useGenerateReply } from '@/hooks/queries/use-ai-reply'
import { toast } from 'sonner'

interface AiReplyButtonProps {
  conversationId: string
  onGenerated: (text: string) => void
}

export function AiReplyButton({ conversationId, onGenerated }: AiReplyButtonProps) {
  const generateReply = useGenerateReply()

  const handleClick = () => {
    generateReply.mutate(
      { conversationId },
      {
        onSuccess: (data) => {
          const reply = (data as { data?: { reply?: string } })?.data?.reply
          if (reply) {
            onGenerated(reply)
            toast.success('AI reply generated — review before sending')
          } else {
            toast.error('No reply generated')
          }
        },
        onError: (err) => toast.error(err.message || 'Failed to generate reply'),
      }
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={generateReply.isPending}
      className="border-purple-500/40 text-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
    >
      {generateReply.isPending ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
      )}
      Generate Reply
    </Button>
  )
}
