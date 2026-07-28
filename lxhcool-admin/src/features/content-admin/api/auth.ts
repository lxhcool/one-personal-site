import type { AdminUser } from '../types'
import { apiFetch } from './client'

export const authApi = {
  me: () => apiFetch<AdminUser>('/auth/me'),
  login: (payload: { email: string; password: string }) =>
    apiFetch<AdminUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () =>
    apiFetch<boolean>('/auth/logout', {
      method: 'POST',
    }),
  register: (payload: {
    email: string
    password: string
    name: string
    registrationCode: string
  }) =>
    apiFetch<AdminUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProfile: (payload: { name?: string | null; avatar?: string | null }) =>
    apiFetch<AdminUser>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
}
