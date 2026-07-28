import { resolveAssetUrl } from './assets'
import { apiFetch } from './client'
import type { UploadResult } from '../types'

async function uploadFile(path: string, file: File) {
  const formData = new FormData()
  formData.set('file', file)
  const result = await apiFetch<UploadResult>(path, {
    method: 'POST',
    body: formData,
  })

  return { url: resolveAssetUrl(result.url) }
}

export const uploadsApi = {
  image: (file: File) => uploadFile('/admin/uploads/images', file),
  audio: (file: File) => uploadFile('/admin/uploads/audio', file),
  video: (file: File) => uploadFile('/admin/uploads/videos', file),
}
