import type { CreateProjectPayload, Project, UpdateProjectPayload } from '../types'
import { apiFetch } from './client'

export const projectsApi = {
  list: () => apiFetch<Project[]>('/admin/projects'),
  get: (id: string) => apiFetch<Project>(`/admin/projects/${id}`),
  create: (payload: CreateProjectPayload) =>
    apiFetch<Project>('/admin/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdateProjectPayload) =>
    apiFetch<Project>(`/admin/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<Project>(`/admin/projects/${id}`, { method: 'DELETE' }),
}
