import { MessageSquareText, ShieldCheck, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchAccounts, fetchRepliedMentions } from '@/lib/api'

const quickActions = [
  {
    title: 'Review replied mentions',
    description: 'Audit the latest replies before the queue grows.',
    icon: MessageSquareText,
    cta: 'Open mentions',
    href: '/mentions',
  },
  {
    title: 'Manage admin accounts',
    description: 'Create, update, and revoke access for moderators.',
    icon: Users,
    cta: 'Open accounts',
    href: '/accounts',
  },
]

export function DashboardPage() {
  const accountsQuery = useQuery({
    queryKey: ['accounts', { limit: 1, offset: 0 }],
    queryFn: () => fetchAccounts({ limit: 1, offset: 0 }),
  })

  const mentionsQuery = useQuery({
    queryKey: ['mentions', { status: 'posted', limit: 1, offset: 0 }],
    queryFn: () => fetchRepliedMentions({ status: 'posted', limit: 1, offset: 0 }),
  })

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Mention Agent Control Room</CardTitle>
          <CardDescription>Stay on top of responses and internal access.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-700">Auth live</Badge>
          <Badge variant="secondary">Admin scope</Badge>
          <Badge variant="outline">MongoDB ready</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => (
          <Card key={action.title} className="shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <a href={action.href}>{action.cta}</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Today at a glance</CardTitle>
            <CardDescription>Visibility into mention activity and access.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Accounts</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {accountsQuery.data?.total ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">Total admins and moderators</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Replies posted</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {mentionsQuery.data?.total ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">Mentions marked posted</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
            <CardDescription>Suggested checks for today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Verify moderator access</p>
                <p className="text-muted-foreground">Ensure permissions match current responsibilities.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
                <MessageSquareText className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Scan replies</p>
                <p className="text-muted-foreground">Spot-check the latest posted responses.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
