import { createFileRoute } from '@tanstack/react-router'
import { PostFormPage } from '@/features/content-admin/post-form'

export const Route = createFileRoute('/_authenticated/posts/$postId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { postId } = Route.useParams()
  return <PostFormPage postId={postId} />
}
