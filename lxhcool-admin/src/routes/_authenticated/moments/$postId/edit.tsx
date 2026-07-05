import { createFileRoute } from '@tanstack/react-router'
import { PostFormPage } from '@/features/content-admin/post-form'

export const Route = createFileRoute('/_authenticated/moments/$postId/edit')({
  component: EditMomentPage,
})

function EditMomentPage() {
  const { postId } = Route.useParams()
  return <PostFormPage postId={postId} initialType='MOMENT' />
}
