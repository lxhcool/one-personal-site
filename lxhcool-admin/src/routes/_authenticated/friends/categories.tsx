import { createFileRoute } from '@tanstack/react-router'
import { CategoryManagementPage } from '@/features/content-admin/categories'

export const Route = createFileRoute('/_authenticated/friends/categories')({
  component: () => (
    <CategoryManagementPage
      type='FRIEND_LINK'
      title='友链分类'
      description='管理友链分类，并为分类上传 Logo 和背景图。'
      showLogo
    />
  ),
})
