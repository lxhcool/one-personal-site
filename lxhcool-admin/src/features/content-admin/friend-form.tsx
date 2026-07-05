import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageShell } from './components/page-shell'
import { categoriesApi, friendLinksApi, optionalString } from './api'

export function FriendFormPage({ friendId }: { friendId?: string }) {
  const navigate = useNavigate()
  const friendLink = useQuery({
    queryKey: ['admin-friend-link', friendId],
    queryFn: () => friendLinksApi.get(friendId!),
    enabled: Boolean(friendId),
  })
  const friendCategories = useQuery({
    queryKey: ['admin-categories', 'FRIEND_LINK'],
    queryFn: () => categoriesApi.list('FRIEND_LINK'),
  })
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      friendId
        ? friendLinksApi.update(friendId, payload)
        : friendLinksApi.create(payload),
    onSuccess: () => navigate({ to: '/friends' }),
  })

  useEffect(() => {
    if (friendLink.isError) throw friendLink.error
    if (friendCategories.isError) throw friendCategories.error
    if (mutation.isError) throw mutation.error
  }, [
    friendLink.error,
    friendLink.isError,
    friendCategories.error,
    friendCategories.isError,
    mutation.error,
    mutation.isError,
  ])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    mutation.mutate({
      name: String(formData.get('name') ?? ''),
      url: String(formData.get('url') ?? ''),
      category: optionalString(formData.get('category')),
      logo: optionalString(formData.get('logo')),
      description: optionalString(formData.get('description')),
      sortOrder: Number(formData.get('sortOrder') ?? 0),
      isVisible: formData.get('isVisible') === 'on',
    })
  }

  const value = friendLink.data

  return (
    <PageShell
      title={friendId ? '编辑友链' : '新建友链'}
      description='友链按排序值从小到大展示。'
    >
      <form onSubmit={onSubmit}>
        <Card className='max-w-3xl'>
          <CardHeader>
            <CardTitle>友链</CardTitle>
            <CardDescription>外部主页、博客或合作站点链接。</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <Field name='name' label='名称' defaultValue={value?.name} required />
            <Field name='url' label='链接' defaultValue={value?.url} required />
            <Field
              name='category'
              label='分类'
              defaultValue={value?.category}
              list='friend-category-options'
            />
            <datalist id='friend-category-options'>
              {(friendCategories.data ?? []).map((category) => (
                <option key={category.id} value={category.name} />
              ))}
            </datalist>
            <Field name='logo' label='Logo 地址' defaultValue={value?.logo} />
            <div className='grid gap-2'>
              <Label htmlFor='description'>描述</Label>
              <Textarea
                id='description'
                name='description'
                defaultValue={value?.description ?? ''}
              />
            </div>
            <Field
              name='sortOrder'
              label='排序'
              type='number'
              defaultValue={String(value?.sortOrder ?? 0)}
            />
            <label className='flex items-center gap-2 text-sm font-medium'>
              <Checkbox name='isVisible' defaultChecked={value?.isVisible ?? true} />
              可见
            </label>
            <Button className='w-fit' disabled={mutation.isPending}>
              <Save />
              保存友链
            </Button>
          </CardContent>
        </Card>
      </form>
    </PageShell>
  )
}

function Field({
  name,
  label,
  defaultValue,
  required,
  type = 'text',
  list,
}: {
  name: string
  label: string
  defaultValue?: string | null
  required?: boolean
  type?: string
  list?: string
}) {
  return (
    <div className='grid gap-2'>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        required={required}
        list={list}
      />
    </div>
  )
}
