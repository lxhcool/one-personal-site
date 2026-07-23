import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type PageShellProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  fluid?: boolean
  fixed?: boolean
  children: React.ReactNode
}

export function PageShell({
  title,
  actions,
  fluid,
  fixed,
  children,
}: PageShellProps) {
  return (
    <>
      <Header>
        <h1 className='min-w-0 flex-1 truncate text-xl font-bold tracking-tight sm:text-2xl'>
          {title}
        </h1>
        {actions ? (
          <div className='flex shrink-0 items-center gap-2'>{actions}</div>
        ) : null}
        <div className='ms-auto flex min-w-0 items-center gap-2'>
          <Search className='hidden flex-none sm:inline-flex sm:w-44 lg:w-56' />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fluid={fluid} fixed={fixed}>
        {children}
      </Main>
    </>
  )
}
