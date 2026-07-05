import { createFileRoute } from '@tanstack/react-router'
import { PostsPage } from '@/features/content-admin/posts'

export const Route = createFileRoute('/_authenticated/posts/')({
  component: PostsPage,
})
