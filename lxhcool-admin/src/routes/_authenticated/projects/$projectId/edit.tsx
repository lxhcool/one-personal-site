import { createFileRoute } from '@tanstack/react-router'
import { ProjectFormPage } from '@/features/content-admin/project-form'

export const Route = createFileRoute('/_authenticated/projects/$projectId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = Route.useParams()
  return <ProjectFormPage projectId={projectId} />
}
