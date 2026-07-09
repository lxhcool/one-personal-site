import { createFileRoute } from '@tanstack/react-router'
import { MusicSettingsPage } from '@/features/content-admin/music-settings'

export const Route = createFileRoute('/_authenticated/music/')({
  component: MusicSettingsPage,
})
