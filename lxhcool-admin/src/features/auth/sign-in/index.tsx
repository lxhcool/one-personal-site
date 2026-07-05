import { Link, useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>登录后台</CardTitle>
          <CardDescription>
            使用邮箱和密码登录管理后台。还没有账号？{' '}
            <Link
              to='/sign-up'
              className='text-nowrap underline underline-offset-4 hover:text-primary'
            >
              注册
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            登录后可以管理文章、项目和友链内容。
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
