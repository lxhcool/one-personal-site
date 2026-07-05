import { createFileRoute } from '@tanstack/react-router'
import { PostFormPage } from '@/features/content-admin/post-form'

export const Route = createFileRoute('/_authenticated/moments/new')({
  component: () => <PostFormPage initialType='MOMENT' />,
})
