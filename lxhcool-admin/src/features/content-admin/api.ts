import { API_BASE_URL } from './env'
import type {
  AdminUser,
  ApiResponse,
  FriendLink,
  Post,
  Project,
  ContentCategory,
  CategoryType,
  SiteWidget,
} from './types'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: isFormData
      ? init?.headers
      : {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = (await response.json()) as { message?: string }
      message = body.message ?? message
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }
    throw new Error(message)
  }

  const body = (await response.json()) as ApiResponse<T>
  if (!body.success) {
    throw new Error(body.message ?? `Request failed: ${path}`)
  }

  return body.data
}

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
  requestRegisterCode: (payload: { email: string }) =>
    apiFetch<{ sent: boolean }>('/auth/register/code', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: (payload: {
    email: string
    password: string
    code: string
    name?: string
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

export const postsApi = {
  list: (type?: string) =>
    apiFetch<Post[]>(`/admin/posts${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  get: (id: string) => apiFetch<Post>(`/admin/posts/${id}`),
  create: (payload: Record<string, unknown>) =>
    apiFetch<Post>('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiFetch<Post>(`/admin/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<Post>(`/admin/posts/${id}`, { method: 'DELETE' }),
}

export const uploadsApi = {
  image: async (file: File) => {
    const formData = new FormData()
    formData.set('file', file)
    const result = await apiFetch<{ url: string }>('/admin/uploads/images', {
      method: 'POST',
      body: formData,
    })

    return {
      url: resolveAssetUrl(result.url),
    }
  },
  audio: async (file: File) => {
    const formData = new FormData()
    formData.set('file', file)
    const result = await apiFetch<{ url: string }>('/admin/uploads/audio', {
      method: 'POST',
      body: formData,
    })

    return {
      url: resolveAssetUrl(result.url),
    }
  },
  video: async (file: File) => {
    const formData = new FormData()
    formData.set('file', file)
    const result = await apiFetch<{ url: string }>('/admin/uploads/videos', {
      method: 'POST',
      body: formData,
    })

    return {
      url: resolveAssetUrl(result.url),
    }
  },
}

export const musicApi = {
  neteaseMetadata: (url: string) =>
    apiFetch<{ id: string; title: string; artist: string; cover: string }>(
      `/admin/music/netease/metadata?url=${encodeURIComponent(url)}`
    ),
  neteasePlaylist: (url: string) =>
    apiFetch<{
      id: string
      title: string
      cover: string
      trackCount: number
      tracks: Array<{
        id: string
        title: string
        artist: string
        cover: string
        externalUrl: string
        embedUrl: string
      }>
    }>(`/admin/music/netease/playlist?url=${encodeURIComponent(url)}`),
}

export const projectsApi = {
  list: () => apiFetch<Project[]>('/admin/projects'),
  get: (id: string) => apiFetch<Project>(`/admin/projects/${id}`),
  create: (payload: Record<string, unknown>) =>
    apiFetch<Project>('/admin/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiFetch<Project>(`/admin/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<Project>(`/admin/projects/${id}`, { method: 'DELETE' }),
}

export const friendLinksApi = {
  list: () => apiFetch<FriendLink[]>('/admin/friend-links'),
  get: (id: string) => apiFetch<FriendLink>(`/admin/friend-links/${id}`),
  create: (payload: Record<string, unknown>) =>
    apiFetch<FriendLink>('/admin/friend-links', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiFetch<FriendLink>(`/admin/friend-links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<FriendLink>(`/admin/friend-links/${id}`, { method: 'DELETE' }),
}

export const categoriesApi = {
  list: (type?: CategoryType) =>
    apiFetch<ContentCategory[]>(
      `/admin/categories${type ? `?type=${encodeURIComponent(type)}` : ''}`
    ),
  create: (payload: {
    type: CategoryType
    name: string
    logo?: string | null
    backgroundImage?: string | null
    sortOrder?: number
  }) =>
    apiFetch<ContentCategory>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (
    id: string,
    payload: {
      type?: CategoryType
      name?: string
      logo?: string | null
      backgroundImage?: string | null
      sortOrder?: number
    }
  ) =>
    apiFetch<ContentCategory>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<ContentCategory>(`/admin/categories/${id}`, { method: 'DELETE' }),
}

export const widgetsApi = {
  list: () => apiFetch<SiteWidget[]>('/admin/widgets'),
  create: (payload: Record<string, unknown>) =>
    apiFetch<SiteWidget>('/admin/widgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiFetch<SiteWidget>(`/admin/widgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<SiteWidget>(`/admin/widgets/${id}`, { method: 'DELETE' }),
}

export function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text || undefined
}

export function toStringList(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function resolveAssetUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url
  if (!url.startsWith('/')) return url
  return `${API_BASE_URL}${url}`
}
