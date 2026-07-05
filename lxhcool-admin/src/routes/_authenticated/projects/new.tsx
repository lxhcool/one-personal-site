import { createFileRoute } from '@tanstack/react-router'
import { ProjectFormPage } from '@/features/content-admin/project-form'

export const Route = createFileRoute('/_authenticated/projects/new')({
  component: () => <ProjectFormPage />,
})
