import { API_BASE_URL } from '../env'

export function resolveAssetUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url
  if (!url.startsWith('/')) return url
  return `${API_BASE_URL}${url}`
}
