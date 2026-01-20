import { useMemo, useState } from 'react'
import { ExternalLink, RefreshCcw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchRepliedMentions } from '@/lib/api'

const statusOptions = [
  'posted',
  'queued',
  'generating',
  'generated',
  'posting',
  'post_failed',
  'failed',
]

export function MentionsPage() {
  const [status, setStatus] = useState('posted')
  const [offset, setOffset] = useState(0)
  const limit = 25

  const mentionsQuery = useQuery({
    queryKey: ['mentions', { status, limit, offset }],
    queryFn: () => fetchRepliedMentions({ status, limit, offset }),
  })

  const items = mentionsQuery.data?.items ?? []
  const total = mentionsQuery.data?.total ?? 0
  const pageCount = useMemo(() => Math.ceil(total / limit), [total])
  const currentPage = Math.floor(offset / limit) + 1

  const handleStatusChange = (value: string) => {
    setStatus(value)
    setOffset(0)
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Replied mentions</CardTitle>
            <CardDescription>All mentions and their reply status from MongoDB.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
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
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Tweet</TableHead>
                <TableHead>Reply</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {mentionsQuery.isLoading ? 'Loading mentions…' : 'No mentions found.'}
                  </TableCell>
                </TableRow>
              )}
              {items.map((item, index) => {
                const mention = item.mention
                const reply = item.reply
                const rowKey =
                  reply.mention_id ?? reply.reply_tweet_id ?? mention?.tweet_id ?? `row-${index}`
                const authorLabel = mention?.author_username
                  ? `@${mention.author_username}`
                  : mention?.author_name || 'Unknown'
                return (
                  <TableRow key={rowKey}>
                    <TableCell>
                      <Badge variant={reply.status === 'posted' ? 'secondary' : 'outline'}>
                        {reply.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{authorLabel}</TableCell>
                    <TableCell className="max-w-[360px] truncate">
                      {mention?.tweet_text || '—'}
                    </TableCell>
                    <TableCell>
                      {reply.reply_url ? (
                        <a
                          href={reply.reply_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {reply.updated_at ? new Date(reply.updated_at).toLocaleString() : '—'}
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
    </div>
  )
}
