import type { CreateFriendLinkPayload, FriendLink, UpdateFriendLinkPayload } from '../types'
import { apiFetch } from './client'

export const friendLinksApi = {
  list: () => apiFetch<FriendLink[]>('/admin/friend-links'),
  get: (id: string) => apiFetch<FriendLink>(`/admin/friend-links/${id}`),
  create: (payload: CreateFriendLinkPayload) =>
    apiFetch<FriendLink>('/admin/friend-links', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdateFriendLinkPayload) =>
    apiFetch<FriendLink>(`/admin/friend-links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<FriendLink>(`/admin/friend-links/${id}`, { method: 'DELETE' }),
}
