import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, Mail, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { authApi } from '@/features/content-admin/api'

const formSchema = z
  .object({
    email: z.email({
      error: (issue) => (issue.input === '' ? '请输入邮箱' : undefined),
    }),
    name: z.string().optional(),
    code: z.string().min(1, '请输入验证码'),
    password: z.string().min(8, '密码至少需要 8 位'),
    confirmPassword: z.string().min(1, '请再次输入密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
      code: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function requestCode() {
    const email = form.getValues('email')
    const parsed = z.email().safeParse(email)
    if (!parsed.success) {
      form.setError('email', { message: '请先输入有效邮箱' })
      return
    }

    setIsSendingCode(true)
    try {
      await authApi.requestRegisterCode({ email })
      toast.success('验证码已发送')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '验证码发送失败')
    } finally {
      setIsSendingCode(false)
    }
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await authApi.register({
        email: data.email,
        name: data.name || undefined,
        code: data.code,
        password: data.password,
      })
      toast.success('注册成功')
      await navigate({ to: '/', replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '注册失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <div className='flex gap-2'>
                <FormControl>
                  <Input placeholder='name@example.com' {...field} />
                </FormControl>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isSendingCode}
                  onClick={requestCode}
                >
                  {isSendingCode ? <Loader2 className='animate-spin' /> : <Mail />}
                  验证码
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>名称</FormLabel>
              <FormControl>
                <Input placeholder='管理员' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='code'
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱验证码</FormLabel>
              <FormControl>
                <Input placeholder='123456' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='请输入密码' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>确认密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='请再次输入密码' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <UserPlus />}
          注册
        </Button>
      </form>
    </Form>
  )
}
