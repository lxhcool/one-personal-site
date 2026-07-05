import { createFileRoute } from '@tanstack/react-router'
import { ContentDashboard } from '@/features/content-admin/dashboard'

export const Route = createFileRoute('/_authenticated/')({
  component: ContentDashboard,
})
