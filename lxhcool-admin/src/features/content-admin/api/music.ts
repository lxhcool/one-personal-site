import type { NeteaseMetadata, NeteasePlaylist } from '../types'
import { apiFetch } from './client'

export const musicApi = {
  neteaseMetadata: (url: string) =>
    apiFetch<NeteaseMetadata>(`/admin/music/netease/metadata?url=${encodeURIComponent(url)}`),
  neteasePlaylist: (url: string) =>
    apiFetch<NeteasePlaylist>(`/admin/music/netease/playlist?url=${encodeURIComponent(url)}`),
}
