import { createFileRoute } from '@tanstack/react-router'
import { FriendsPage } from '@/features/content-admin/friends'

export const Route = createFileRoute('/_authenticated/friends/')({
  component: FriendsPage,
})
