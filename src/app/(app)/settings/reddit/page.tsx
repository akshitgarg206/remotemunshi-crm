'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Unplug, CheckCircle, Loader2, FileText, Mail, Import } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  useRedditStatus, useRedditPosts, useRedditComments, useRedditMessages,
  useImportRedditLeads, useDisconnectReddit,
} from '@/hooks/queries/use-reddit'

export default function RedditSettingsPage() {
  const { data: statusData, isLoading: statusLoading } = useRedditStatus()
  const status = statusData?.data as Record<string, unknown> | undefined
  const isConnected = status?.connected === true
  const disconnectMutation = useDisconnectReddit()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reddit Integration</h1>
          <p className="text-muted-foreground text-sm">Import engagement on your Reddit posts as leads</p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : isConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">u/{status?.account_name as string}</p>
                  <p className="text-sm text-muted-foreground">Reddit account connected</p>
                </div>
                <Badge variant="default" className="bg-green-600">Connected</Badge>
              </div>
              <Button variant="destructive" size="sm" onClick={() => {
                if (confirm('Disconnect Reddit?')) disconnectMutation.mutate()
              }} disabled={disconnectMutation.isPending}>
                <Unplug className="mr-1 h-4 w-4" /> Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Not connected to Reddit</p>
              <Button onClick={() => { window.location.href = '/api/v1/integrations/reddit/auth' }}>
                <MessageSquare className="mr-2 h-4 w-4" /> Connect Reddit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <>
          <PostsSection />
          <MessagesSection />
        </>
      )}
    </div>
  )
}

function PostsSection() {
  const [browsing, setBrowsing] = useState(false)
  const { data, isLoading } = useRedditPosts(browsing)
  const posts = (data?.data || []) as Record<string, unknown>[]
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> My Posts</CardTitle>
          <CardDescription>View your Reddit posts and import commenters as leads</CardDescription>
        </CardHeader>
        <CardContent>
          {!browsing ? (
            <Button variant="outline" onClick={() => setBrowsing(true)}>Browse My Posts</Button>
          ) : isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts found</p>
          ) : (
            <div className="max-h-[500px] overflow-y-auto space-y-1">
              {posts.map((post) => (
                <div
                  key={post.id as string}
                  className="flex items-center justify-between gap-3 p-3 rounded hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedPostId(post.id as string)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.title as string}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.subreddit as string} · {post.num_comments as number} comments · {post.score as number} upvotes
                      {post.created_utc && ` · ${new Date((post.created_utc as number) * 1000).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Comments
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPostId && (
        <CommentsDialog
          postId={selectedPostId}
          postTitle={posts.find(p => p.id === selectedPostId)?.title as string || ''}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </>
  )
}

function CommentsDialog({ postId, postTitle, onClose }: { postId: string; postTitle: string; onClose: () => void }) {
  const { data, isLoading } = useRedditComments(postId)
  const comments = (data?.data || []) as Record<string, unknown>[]
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const importMutation = useImportRedditLeads()

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleImport() {
    const items = comments
      .filter(c => selected.has(c.id as string))
      .map(c => ({
        type: 'comment' as const,
        id: c.id as string,
        author: c.author as string,
        body: c.body as string,
        post_title: postTitle,
      }))
    importMutation.mutate(items, {
      onSuccess: (data: any) => {
        toast.success(`Imported ${data?.data?.imported || 0} leads (${data?.data?.skipped || 0} already imported)`)
        setSelected(new Set())
      },
      onError: (err: Error) => toast.error(err.message),
    })
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">Comments on: {postTitle}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No comments found</p>
        ) : (
          <>
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-muted-foreground">{comments.length} comments, {selected.size} selected</p>
              <Button size="sm" disabled={selected.size === 0 || importMutation.isPending} onClick={handleImport}>
                {importMutation.isPending ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Importing...</>
                ) : (
                  <><Import className="mr-1 h-4 w-4" /> Import {selected.size} as Leads</>
                )}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {comments.map((comment) => (
                <div
                  key={comment.id as string}
                  className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => toggleSelect(comment.id as string)}
                >
                  <Checkbox checked={selected.has(comment.id as string)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">u/{comment.author as string}</p>
                      <span className="text-xs text-muted-foreground">{comment.score as number} pts</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{comment.body as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function MessagesSection() {
  const [browsing, setBrowsing] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { data, isLoading } = useRedditMessages(browsing)
  const messages = (data?.data || []) as Record<string, unknown>[]
  const importMutation = useImportRedditLeads()

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleImport() {
    const items = messages
      .filter(m => selected.has(m.id as string))
      .map(m => ({
        type: 'message' as const,
        id: m.id as string,
        author: m.author as string,
        body: m.body as string,
      }))
    importMutation.mutate(items, {
      onSuccess: (data: any) => {
        toast.success(`Imported ${data?.data?.imported || 0} leads (${data?.data?.skipped || 0} already imported)`)
        setSelected(new Set())
      },
      onError: (err: Error) => toast.error(err.message),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Messages</CardTitle>
        <CardDescription>Import message senders as leads</CardDescription>
      </CardHeader>
      <CardContent>
        {!browsing ? (
          <Button variant="outline" onClick={() => setBrowsing(true)}>Browse Messages</Button>
        ) : isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages found</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{messages.length} messages, {selected.size} selected</p>
              <Button size="sm" disabled={selected.size === 0 || importMutation.isPending} onClick={handleImport}>
                {importMutation.isPending ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Importing...</>
                ) : (
                  <><Import className="mr-1 h-4 w-4" /> Import {selected.size} as Leads</>
                )}
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {messages.map((msg) => (
                <div
                  key={msg.id as string}
                  className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => toggleSelect(msg.id as string)}
                >
                  <Checkbox checked={selected.has(msg.id as string)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">u/{msg.author as string}</p>
                      <span className="text-xs text-muted-foreground">{msg.subject as string}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.body as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
