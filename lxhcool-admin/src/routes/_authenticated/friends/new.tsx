import { createFileRoute } from '@tanstack/react-router'
import { FriendFormPage } from '@/features/content-admin/friend-form'

export const Route = createFileRoute('/_authenticated/friends/new')({
  component: () => <FriendFormPage />,
})
