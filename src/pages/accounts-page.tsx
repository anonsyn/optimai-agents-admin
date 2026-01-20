import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AccountCreatePayload, AccountResponse, AccountUpdatePayload } from '@/lib/api'
import { createAccount, deleteAccount, fetchAccounts, handleError, updateAccount } from '@/lib/api'

const permissionOptions = [
  { value: 'mentions', label: 'Mentions' },
  { value: 'accounts', label: 'Accounts' },
] as const

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
] as const

const emptyCreate: AccountCreatePayload = {
  username: '',
  password: '',
  display_name: '',
  role: 'moderator',
  permissions: ['mentions'],
  is_active: true,
}

export function AccountsPage() {
  const queryClient = useQueryClient()
  const [offset, setOffset] = useState(0)
  const limit = 25
  const [createForm, setCreateForm] = useState<AccountCreatePayload>(emptyCreate)
  const [editOpen, setEditOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<AccountResponse | null>(null)
  const [editForm, setEditForm] = useState<AccountUpdatePayload>({})

  const accountsQuery = useQuery({
    queryKey: ['accounts', { limit, offset }],
    queryFn: () => fetchAccounts({ limit, offset }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: AccountCreatePayload) => createAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setCreateForm(emptyCreate)
    },
    onError: (error) => handleError(error, 'Failed to create account'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ accountId, payload }: { accountId: string; payload: AccountUpdatePayload }) =>
      updateAccount(accountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setEditOpen(false)
    },
    onError: (error) => handleError(error, 'Failed to update account'),
  })

  const deleteMutation = useMutation({
    mutationFn: (accountId: string) => deleteAccount(accountId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (error) => handleError(error, 'Failed to delete account'),
  })

  const items = accountsQuery.data?.items ?? []
  const total = accountsQuery.data?.total ?? 0
  const pageCount = useMemo(() => Math.ceil(total / limit), [total])
  const currentPage = Math.floor(offset / limit) + 1

  const permissionsDisabled = createForm.role === 'admin'
  const createPermissions = permissionsDisabled ? permissionOptions.map((p) => p.value) : createForm.permissions

  const updatePermissionsDisabled = editForm.role === 'admin'
  const updatePermissions = updatePermissionsDisabled ? permissionOptions.map((p) => p.value) : editForm.permissions

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.username.trim() || !createForm.password.trim()) {
      return
    }
    createMutation.mutate({
      ...createForm,
      username: createForm.username.trim(),
      display_name: createForm.display_name?.trim() || null,
      permissions: createPermissions ?? [],
    })
  }

  const handleDelete = (account: AccountResponse) => {
    if (!window.confirm(`Delete ${account.username}? This cannot be undone.`)) {
      return
    }
    deleteMutation.mutate(account.id)
  }

  const openEdit = (account: AccountResponse) => {
    setEditAccount(account)
    setEditForm({
      username: account.username,
      display_name: account.display_name ?? '',
      role: account.role,
      permissions: account.permissions,
      is_active: account.is_active,
    })
    setEditOpen(true)
  }

  const submitEdit = () => {
    if (!editAccount) {
      return
    }
    const payload: AccountUpdatePayload = {
      role: editForm.role,
      permissions: updatePermissions ?? [],
      is_active: editForm.is_active,
      display_name: editForm.display_name?.trim() || null,
    }
    if (editForm.username?.trim()) {
      payload.username = editForm.username.trim()
    }
    if (editForm.password?.trim()) {
      payload.password = editForm.password.trim()
    }
    updateMutation.mutate({ accountId: editAccount.id, payload })
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>New account</CardTitle>
          <CardDescription>Grant access to admins and moderators.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={createForm.username}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="moderator"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={createForm.display_name ?? ''}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, display_name: event.target.value }))}
                placeholder="Mentions Ops"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    role: value as AccountCreatePayload['role'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 md:col-span-2">
              <Label>Permissions</Label>
              <div className="flex flex-wrap gap-3">
                {permissionOptions.map((permission) => {
                  const checked = createPermissions?.includes(permission.value)
                  return (
                    <label
                      key={permission.value}
                      className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={permissionsDisabled}
                        onCheckedChange={() => {
                          if (permissionsDisabled) {
                            return
                          }
                          setCreateForm((prev) => {
                            const next = new Set(prev.permissions ?? [])
                            if (next.has(permission.value)) {
                              next.delete(permission.value)
                            } else {
                              next.add(permission.value)
                            }
                            return { ...prev, permissions: Array.from(next) as AccountCreatePayload['permissions'] }
                          })
                        }}
                      />
                      {permission.label}
                    </label>
                  )
                })}
                {permissionsDisabled && <Badge variant="secondary">Admins receive all permissions</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={createForm.is_active}
                onCheckedChange={(value) => setCreateForm((prev) => ({ ...prev, is_active: value }))}
              />
              <span className="text-sm text-muted-foreground">Account active</span>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>View and manage existing access.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {accountsQuery.isLoading ? 'Loading accounts…' : 'No accounts found.'}
                  </TableCell>
                </TableRow>
              )}
              {items.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="max-w-[220px]">
                    <div className="font-medium text-foreground">{account.username}</div>
                    <div className="text-xs text-muted-foreground">{account.display_name || '—'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.role === 'admin' ? 'secondary' : 'outline'}>{account.role}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <div className="flex flex-wrap gap-2">
                      {(account.permissions || []).map((permission) => (
                        <Badge key={permission} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{account.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {account.last_login_at ? new Date(account.last_login_at).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(account)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
            <DialogDescription>Update role, permissions, and credentials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={editForm.username ?? ''}
                onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input
                value={editForm.display_name ?? ''}
                onChange={(event) => setEditForm((prev) => ({ ...prev, display_name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                value={editForm.password ?? ''}
                onChange={(event) => setEditForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Leave blank to keep"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    role: value as AccountUpdatePayload['role'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="flex flex-wrap gap-3">
                {permissionOptions.map((permission) => {
                  const checked = updatePermissions?.includes(permission.value)
                  return (
                    <label
                      key={permission.value}
                      className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={updatePermissionsDisabled}
                        onCheckedChange={() => {
                          if (updatePermissionsDisabled) {
                            return
                          }
                          setEditForm((prev) => {
                            const next = new Set(prev.permissions ?? [])
                            if (next.has(permission.value)) {
                              next.delete(permission.value)
                            } else {
                              next.add(permission.value)
                            }
                            return { ...prev, permissions: Array.from(next) as AccountUpdatePayload['permissions'] }
                          })
                        }}
                      />
                      {permission.label}
                    </label>
                  )
                })}
                {updatePermissionsDisabled && <Badge variant="secondary">Admins receive all permissions</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.is_active ?? true}
                onCheckedChange={(value) => setEditForm((prev) => ({ ...prev, is_active: value }))}
              />
              <span className="text-sm text-muted-foreground">Account active</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
