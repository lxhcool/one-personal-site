import { createFileRoute } from '@tanstack/react-router'
import { FriendFormPage } from '@/features/content-admin/friend-form'

export const Route = createFileRoute('/_authenticated/friends/$friendId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { friendId } = Route.useParams()
  return <FriendFormPage friendId={friendId} />
}
