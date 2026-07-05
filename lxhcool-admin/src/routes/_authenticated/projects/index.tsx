import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/content-admin/projects'

export const Route = createFileRoute('/_authenticated/projects/')({
  component: ProjectsPage,
})
