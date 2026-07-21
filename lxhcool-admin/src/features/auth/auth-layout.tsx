import { Logo } from '@/assets/logo'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='container grid min-h-svh max-w-none items-center justify-center px-4'>
      <div className='mx-auto flex w-full max-w-[520px] flex-col justify-center space-y-2 py-8 sm:px-6'>
        <div className='mb-4 flex items-center justify-center'>
          <Logo className='me-2' />
          <h1 className='text-xl font-medium'>lxhcoool.cn 后台</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
