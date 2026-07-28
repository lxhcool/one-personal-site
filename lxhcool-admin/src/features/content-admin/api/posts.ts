import type { CreatePostPayload, Post, UpdatePostPayload } from '../types'
import { apiFetch } from './client'

export const postsApi = {
  list: (type?: string) =>
    apiFetch<Post[]>(`/admin/posts${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  get: (id: string) => apiFetch<Post>(`/admin/posts/${id}`),
  create: (payload: CreatePostPayload) =>
    apiFetch<Post>('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdatePostPayload) =>
    apiFetch<Post>(`/admin/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<Post>(`/admin/posts/${id}`, { method: 'DELETE' }),
}
