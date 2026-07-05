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
  children: React.ReactNode
}

export function PageShell({
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <>
      <Header>
        <div className='ms-auto flex min-w-0 items-center gap-2'>
          <Search className='hidden flex-none sm:inline-flex sm:w-44 lg:w-56' />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
            {description ? (
              <p className='text-muted-foreground'>{description}</p>
            ) : null}
          </div>
          {actions ? <div className='flex items-center gap-2'>{actions}</div> : null}
        </div>
        {children}
      </Main>
    </>
  )
}
