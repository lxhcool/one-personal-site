import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { authApi } from '@/features/content-admin/api'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: ['auth-me'],
        queryFn: authApi.me,
      })
    } catch {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: `${location.pathname}${location.searchStr}`,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
