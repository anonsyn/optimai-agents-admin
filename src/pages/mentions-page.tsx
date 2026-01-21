import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  ExternalLink,
  MoreHorizontal,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  SquarePen,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  { value: 'all', label: 'All statuses' },
  { value: 'posted', label: 'Posted' },
  { value: 'skipped', label: 'Skipped' },
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

const getStatusBadgeVariant = (status: string, isSkipped: boolean) => {
  if (isSkipped) return 'secondary' // Gray
  if (status === 'posted') return 'success' // Green
  if (['failed', 'post_failed'].includes(status)) return 'destructive' // Red
  if (['queued', 'generating', 'generated', 'posting'].includes(status)) return 'info' // Blue
  return 'outline' // Fallback
}

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

  const markPosted = (item: RepliedMentionItem) => {
    const mentionId = item.reply.mention_id ?? item.mention?.tweet_id
    if (!mentionId) {
      handleError(new Error('Missing mention id'), 'Missing mention id')
      return
    }
    manualMutation.mutate({ mentionId, payload: { status: 'posted' } })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Replied mentions</h1>
          <p className=" text-muted-foreground">Search and manually reconcile replies from MongoDB.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mentionsQuery.refetch()}
            disabled={mentionsQuery.isFetching}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setOffset(0)
              }}
              placeholder="Search mentions..."
            />
          </div>
          <Select
            value={searchType}
            onValueChange={(value) => {
              setSearchType(value)
              setOffset(0)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Search field" />
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
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className=" font-medium">Filter:</span>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value)
              setOffset(0)
            }}
          >
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
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px] pl-6">Author</TableHead>
                <TableHead className="w-[350px]">Tweet</TableHead>
                <TableHead className="w-[350px]">Reply</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[160px]">Updated</TableHead>
                <TableHead className="w-[80px] pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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

                const isSkipped = mention?.is_skipped ?? false
                const statusVariant = getStatusBadgeVariant(reply.status ?? '', isSkipped)
                const statusLabel = isSkipped
                  ? 'Skipped'
                  : statusLabelMap.get(reply.status ?? '') || reply.status || 'No reply'

                return (
                  <TableRow key={rowKey}>
                    <TableCell className="pl-6 align-top">
                      <div className="font-medium text-foreground truncate">{authorLabel}</div>
                      <div className="text-xs text-muted-foreground truncate">{mention?.author_name || '—'}</div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className=" text-foreground line-clamp-3 wrap-break-word font-sans whitespace-pre-wrap">
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
                    <TableCell className="align-top">
                      <div className=" text-foreground line-clamp-4 font-sans wrap-break-word whitespace-pre-wrap">
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
                    <TableCell className="align-top">
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </TableCell>
                    <TableCell className="align-top tabular-nums text-muted-foreground">
                      <div>{reply.updated_at ? new Date(reply.updated_at).toLocaleDateString() : '—'}</div>
                      <div>{reply.updated_at ? new Date(reply.updated_at).toLocaleTimeString() : ''}</div>
                    </TableCell>
                    <TableCell className="pr-6 text-right align-top">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => markPosted(item)}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                            Mark as Posted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openManual(item)}>
                            <SquarePen className="mr-2 h-4 w-4" />
                            Edit Manual Reply
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => markSkipped(item)}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark as Skipped
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t p-4 text-xs text-muted-foreground bg-muted/20">
            <span>
              Page {currentPage} of {pageCount}
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
        )}
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
                onChange={(event) => setManualForm((prev) => ({ ...prev, reply_text: event.target.value }))}
                placeholder="Paste the manual reply"
                className="font-mono "
                rows={4}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reply URL</Label>
                <Input
                  value={manualForm.reply_url ?? ''}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, reply_url: event.target.value }))}
                  placeholder="https://x.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Reply tweet ID</Label>
                <Input
                  value={manualForm.reply_tweet_id ?? ''}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, reply_tweet_id: event.target.value }))}
                  placeholder="123456789"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reply username</Label>
                <Input
                  value={manualForm.reply_username ?? ''}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, reply_username: event.target.value }))}
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
