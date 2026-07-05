import { createFileRoute } from '@tanstack/react-router'
import { CategoryManagementPage } from '@/features/content-admin/categories'

export const Route = createFileRoute('/_authenticated/posts/categories')({
  component: () => (
    <CategoryManagementPage
      type='POST'
      title='文章分类'
      description='管理文章分类，并为分类上传背景图。'
    />
  ),
})
