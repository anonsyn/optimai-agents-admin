import { useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, RefreshCcw, SquarePen, XCircle } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchRepliedMentions,
  handleError,
  markManualReply,
  type ManualReplyPayload,
  type RepliedMentionItem,
} from '@/lib/api'

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'posted', label: 'Posted' },
  { value: 'post_failed', label: 'Post failed' },
  { value: 'failed', label: 'Failed' },
  { value: 'queued', label: 'Queued' },
  { value: 'generating', label: 'Generating' },
  { value: 'generated', label: 'Generated' },
  { value: 'posting', label: 'Posting' },
]

const searchOptions = [
  { value: 'all', label: 'All fields' },
  { value: 'author', label: 'Author' },
  { value: 'tweet', label: 'Tweet text' },
  { value: 'reply', label: 'Reply text' },
]

const buildManualPayload = (item: RepliedMentionItem): ManualReplyPayload => ({
  reply_text: item.reply.reply_text ?? '',
  reply_url: item.reply.reply_url ?? '',
  reply_tweet_id: item.reply.reply_tweet_id ?? '',
  reply_username: item.reply.reply_username ?? '',
  status: (item.mention?.is_skipped ? 'skipped' : item.reply.status) as ManualReplyPayload['status'],
})

export function MentionsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('posted')
  const [searchType, setSearchType] = useState('all')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualTarget, setManualTarget] = useState<RepliedMentionItem | null>(null)
  const [manualForm, setManualForm] = useState<ManualReplyPayload>({ status: 'posted' })
  const limit = 25

  const trimmedQuery = query.trim()


  const mentionsQuery = useQuery({
    queryKey: ['mentions', { status, searchType, trimmedQuery, limit, offset }],
    queryFn: () =>
      fetchRepliedMentions({
        status,
        search_type: searchType as 'all' | 'author' | 'tweet' | 'reply',
        q: trimmedQuery || undefined,
        limit,
        offset,
      }),
  })

  const manualMutation = useMutation({
    mutationFn: ({ mentionId, payload }: { mentionId: string; payload: ManualReplyPayload }) =>
      markManualReply(mentionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      setManualOpen(false)
    },
    onError: (error) => handleError(error, 'Failed to update reply'),
  })

  const items = mentionsQuery.data?.items ?? []
  const total = mentionsQuery.data?.total ?? 0
  const statusLabelMap = new Map(statusOptions.map((option) => [option.value, option.label]))
  const pageCount = useMemo(() => Math.ceil(total / limit), [total])
  const currentPage = Math.floor(offset / limit) + 1

  const openManual = (item: RepliedMentionItem) => {
    setManualTarget(item)
    setManualForm(buildManualPayload(item))
    setManualOpen(true)
  }

  const submitManual = () => {
    if (!manualTarget) {
      return
    }
    const mentionId = manualTarget.reply.mention_id ?? manualTarget.mention?.tweet_id
    if (!mentionId) {
      handleError(new Error('Missing mention id'), 'Missing mention id')
      return
    }
    manualMutation.mutate({
      mentionId,
      payload: {
        ...manualForm,
        reply_text: manualForm.reply_text?.trim() || undefined,
        reply_url: manualForm.reply_url?.trim() || undefined,
        reply_tweet_id: manualForm.reply_tweet_id?.trim() || undefined,
        reply_username: manualForm.reply_username?.trim() || undefined,
      },
    })
  }

  const markSkipped = (item: RepliedMentionItem) => {
    const mentionId = item.reply.mention_id ?? item.mention?.tweet_id
    if (!mentionId) {
      handleError(new Error('Missing mention id'), 'Missing mention id')
      return
    }
    manualMutation.mutate({ mentionId, payload: { status: 'skipped' } })
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Replied mentions</CardTitle>
            <CardDescription>Search and manually reconcile replies from MongoDB.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex w-full max-w-md items-center gap-2">
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setOffset(0)
                }}
                placeholder="Search mentions"
              />
              <Select value={searchType} onValueChange={(value) => {
                  setSearchType(value)
                  setOffset(0)
                }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Search" />
                </SelectTrigger>
                <SelectContent>
                  {searchOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={status} onValueChange={(value) => {
              setStatus(value)
              setOffset(0)
            }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => mentionsQuery.refetch()} disabled={mentionsQuery.isFetching}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Tweet</TableHead>
                <TableHead>Reply</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {mentionsQuery.isLoading ? 'Loading mentions…' : 'No mentions found.'}
                  </TableCell>
                </TableRow>
              )}
              {items.map((item, index) => {
                const mention = item.mention
                const reply = item.reply
                const mentionId = reply.mention_id ?? mention?.tweet_id
                const rowKey = mentionId ?? reply.reply_tweet_id ?? `row-${index}`
                const authorLabel = mention?.author_username
                  ? `@${mention.author_username}`
                  : mention?.author_name || 'Unknown'
                return (
                  <TableRow key={rowKey}>
                    <TableCell className="max-w-[120px]">
                      <div className="font-medium text-foreground">{authorLabel}</div>
                      <div className="text-xs text-muted-foreground">
                        {mention?.author_name || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="text-sm text-foreground line-clamp-2">
                        {mention?.tweet_text || '—'}
                      </div>
                      {mention?.tweet_url && (
                        <a
                          href={mention.tweet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View tweet
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="text-sm text-foreground line-clamp-2">
                        {reply.reply_text || '—'}
                      </div>
                      {reply.reply_url && (
                        <a
                          href={reply.reply_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View reply
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={mention?.is_skipped || reply.status === 'posted' ? 'secondary' : 'outline'}>
                        {mention?.is_skipped
                          ? 'Skipped'
                          : statusLabelMap.get(reply.status ?? '') || reply.status || 'No reply'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reply.updated_at ? new Date(reply.updated_at).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            manualMutation.mutate({
                              mentionId: mentionId ?? rowKey,
                              payload: { status: 'posted' },
                            })
                          }
                          disabled={manualMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openManual(item)}>
                          <SquarePen className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => markSkipped(item)}
                          disabled={manualMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {currentPage} of {pageCount || 1}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(offset - limit, 0))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual reply update</DialogTitle>
            <DialogDescription>Record a manual reply or mark as skipped.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reply text</Label>
              <Textarea
                value={manualForm.reply_text ?? ''}
                onChange={(event) =>
                  setManualForm((prev) => ({ ...prev, reply_text: event.target.value }))
                }
                placeholder="Paste the manual reply"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reply URL</Label>
                <Input
                  value={manualForm.reply_url ?? ''}
                  onChange={(event) =>
                    setManualForm((prev) => ({ ...prev, reply_url: event.target.value }))
                  }
                  placeholder="https://x.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Reply tweet ID</Label>
                <Input
                  value={manualForm.reply_tweet_id ?? ''}
                  onChange={(event) =>
                    setManualForm((prev) => ({ ...prev, reply_tweet_id: event.target.value }))
                  }
                  placeholder="123456789"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reply username</Label>
                <Input
                  value={manualForm.reply_username ?? ''}
                  onChange={(event) =>
                    setManualForm((prev) => ({ ...prev, reply_username: event.target.value }))
                  }
                  placeholder="optimai"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={manualForm.status ?? 'posted'}
                  onValueChange={(value) =>
                    setManualForm((prev) => ({
                      ...prev,
                      status: value as ManualReplyPayload['status'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitManual} disabled={manualMutation.isPending}>
              {manualMutation.isPending ? 'Saving…' : 'Save update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
