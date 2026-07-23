export function requireAdminEnv(name: string) {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing required admin environment variable: ${name}`)
  }
  return value
}

function resolveApiBaseUrl(value: string) {
  const normalized = value.replace(/\/+$/, '')

  if (typeof window === 'undefined') return normalized

  try {
    const url = new URL(normalized)
    const pageHost = window.location.hostname
    const isLocalApi = url.hostname === '127.0.0.1' || url.hostname === 'localhost'
    const isLocalPage = pageHost === '127.0.0.1' || pageHost === 'localhost'

    if (isLocalApi && isLocalPage && url.hostname !== pageHost) {
      url.hostname = pageHost
      return url.toString().replace(/\/+$/, '')
    }
  } catch {
    // Relative API URLs do not need hostname normalization.
  }

  return normalized
}

export const API_BASE_URL = resolveApiBaseUrl(
  requireAdminEnv('VITE_API_BASE_URL')
)

function resolveLocalFrontendUrl(value: string) {
  const normalized = value.replace(/\/+$/, '')

  if (typeof window === 'undefined') return normalized

  try {
    const url = new URL(normalized)
    const pageHost = window.location.hostname
    const isLocalFrontend = url.hostname === '127.0.0.1' || url.hostname === 'localhost'
    const isLocalPage = pageHost === '127.0.0.1' || pageHost === 'localhost'

    if (isLocalFrontend && isLocalPage) {
      url.hostname = pageHost
      return url.toString().replace(/\/+$/, '')
    }
  } catch {
    // Relative frontend URLs do not need hostname normalization.
  }

  return normalized
}

export const FRONTEND_PREVIEW_URL = resolveLocalFrontendUrl(
  import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'
)
