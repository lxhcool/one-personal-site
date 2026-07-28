import type {
  CategoryType,
  ContentCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../types'
import { apiFetch } from './client'

export const categoriesApi = {
  list: (type?: CategoryType) =>
    apiFetch<ContentCategory[]>(
      `/admin/categories${type ? `?type=${encodeURIComponent(type)}` : ''}`
    ),
  create: (payload: CreateCategoryPayload) =>
    apiFetch<ContentCategory>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdateCategoryPayload) =>
    apiFetch<ContentCategory>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<ContentCategory>(`/admin/categories/${id}`, { method: 'DELETE' }),
}
