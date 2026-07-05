import { createFileRoute } from '@tanstack/react-router'
import { WidgetsPage } from '@/features/content-admin/widgets'

export const Route = createFileRoute('/_authenticated/widgets/')({
  component: WidgetsPage,
})
