import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, LogOut, UserPen } from 'lucide-react'
import { toast } from 'sonner'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { getDisplayNameInitials } from '@/lib/utils'
import { authApi, resolveAssetUrl, uploadsApi } from '@/features/content-admin/api'

export function ProfileDropdown() {
  const [signOutOpen, setSignOutOpen] = useDialogState()
  const [profileOpen, setProfileOpen] = useState(false)
  const currentUser = useQuery({
    queryKey: ['auth-me'],
    queryFn: authApi.me,
  })

  const user = currentUser.data
  const displayName = user?.name || '管理员'
  const avatar = user?.avatar ? resolveAssetUrl(user.avatar) : undefined

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={avatar} alt={displayName} />
              <AvatarFallback>{getDisplayNameInitials(displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>{displayName}</p>
              <p className='text-xs leading-none text-muted-foreground'>
                {user?.email ?? 'admin@lxhcoool.cn'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <UserPen />
            编辑资料
          </DropdownMenuItem>
          <DropdownMenuItem
            className='text-destructive'
            onClick={() => setSignOutOpen(true)}
          >
            <LogOut />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <SignOutDialog open={!!signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  )
}

function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentUser = useQuery({
    queryKey: ['auth-me'],
    queryFn: authApi.me,
  })
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!open || !currentUser.data) return
    setName(currentUser.data.name ?? '')
    setAvatar(currentUser.data.avatar ?? '')
  }, [currentUser.data, open])

  const mutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(['auth-me'], user)
      toast.success('资料已保存')
      onOpenChange(false)
    },
  })

  async function uploadAvatar(file: File) {
    setIsUploading(true)
    try {
      const image = await uploadsApi.image(file)
      setAvatar(image.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '头像上传失败')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate({
      name: name.trim() || null,
      avatar: avatar || null,
    })
  }

  const displayName = name || currentUser.data?.email || '管理员'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑资料</DialogTitle>
          <DialogDescription>修改后台和前台头像菜单展示的昵称与头像。</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className='grid gap-4'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
              <AvatarImage src={avatar ? resolveAssetUrl(avatar) : undefined} alt={displayName} />
              <AvatarFallback>{getDisplayNameInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className='grid gap-2'>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp,image/gif'
                className='hidden'
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (file) void uploadAvatar(file)
                }}
              />
              <Button
                type='button'
                variant='outline'
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus />
                {avatar ? '更换头像' : '上传头像'}
              </Button>
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='profile-name'>昵称</Label>
            <Input
              id='profile-name'
              value={name}
              maxLength={80}
              placeholder='管理员'
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button disabled={mutation.isPending}>保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
