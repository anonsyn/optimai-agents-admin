import { toast } from 'sonner'
import { api } from './axios'

export type LoginRequest = {
  username: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

export type Role = 'admin' | 'moderator'
export type Permission = 'mentions' | 'accounts'

export type AccountResponse = {
  id: string
  username: string
  display_name?: string | null
  role: Role
  permissions: Permission[]
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string | null
}

export type AccountListResponse = {
  items: AccountResponse[]
  total: number
}

export type AccountCreatePayload = {
  username: string
  password: string
  display_name?: string | null
  role: Role
  permissions?: Permission[] | null
  is_active: boolean
}

export type AccountUpdatePayload = {
  username?: string
  password?: string
  display_name?: string | null
  role?: Role
  permissions?: Permission[] | null
  is_active?: boolean
}

export type MentionSummary = {
  mention_id?: string | null
  tweet_id?: string | null
  tweet_text?: string | null
  tweet_url?: string | null
  tweet_created_at?: string | null
  author_id?: string | null
  author_name?: string | null
  author_username?: string | null
  ingested_at?: string | null
  is_skipped?: boolean | null
}

export type ReplySummary = {
  mention_id?: string | null
  status?: string | null
  reply_text?: string | null
  reply_url?: string | null
  reply_tweet_id?: string | null
  reply_username?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type RepliedMentionItem = {
  mention?: MentionSummary | null
  reply: ReplySummary
}

export type RepliedMentionsResponse = {
  items: RepliedMentionItem[]
  total: number
}

export type ManualReplyPayload = {
  reply_text?: string | null
  reply_url?: string | null
  reply_tweet_id?: string | null
  reply_username?: string | null
  status?: 'posted' | 'skipped'
}

// --- API Methods ---

export async function adminLogin(payload: LoginRequest) {
  const { data } = await api.post<LoginResponse>('/api/auth/login', payload)
  return data
}

export async function fetchCurrentUser() {
  const { data } = await api.get<AccountResponse>('/api/auth/me')
  return data
}

export async function fetchAccounts(params: { limit: number; offset: number }) {
  const { data } = await api.get<AccountListResponse>('/api/accounts', { params })
  return data
}

export async function createAccount(payload: AccountCreatePayload) {
  const { data } = await api.post<AccountResponse>('/api/accounts', payload)
  return data
}

export async function updateAccount(accountId: string, payload: AccountUpdatePayload) {
  const { data } = await api.patch<AccountResponse>(`/api/accounts/${accountId}`, payload)
  return data
}

export async function deleteAccount(accountId: string) {
  await api.delete(`/api/accounts/${accountId}`)
}

export async function fetchRepliedMentions(params: {
  status?: string
  q?: string
  search_type?: 'all' | 'author' | 'tweet' | 'reply'
  limit: number
  offset: number
}) {
  const { data } = await api.get<RepliedMentionsResponse>('/api/mentions/replied', {
    params,
  })
  return data
}

export async function markManualReply(mentionId: string, payload: ManualReplyPayload) {
  const { data } = await api.post(`/api/mentions/replied/${mentionId}/manual`, payload)
  return data
}

export function handleError(error: unknown, fallback = 'Request failed') {
  const message = error instanceof Error ? error.message : fallback
  toast.error(message)
  return message
}
