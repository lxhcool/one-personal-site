import type { CreateWidgetPayload, SiteWidget, UpdateWidgetPayload } from '../types'
import { apiFetch } from './client'

export const widgetsApi = {
  list: () => apiFetch<SiteWidget[]>('/admin/widgets'),
  create: (payload: CreateWidgetPayload) =>
    apiFetch<SiteWidget>('/admin/widgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdateWidgetPayload) =>
    apiFetch<SiteWidget>(`/admin/widgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<SiteWidget>(`/admin/widgets/${id}`, { method: 'DELETE' }),
}
