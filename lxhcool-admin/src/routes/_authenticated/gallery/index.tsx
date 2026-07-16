import { createFileRoute } from '@tanstack/react-router'
import { GallerySettingsPage } from '@/features/content-admin/gallery-settings'

export const Route = createFileRoute('/_authenticated/gallery/')({
  component: GallerySettingsPage,
})
