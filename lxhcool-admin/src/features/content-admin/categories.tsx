import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageShell } from './components/page-shell'
import { categoriesApi, resolveAssetUrl, uploadsApi } from './api'
import type { CategoryType, ContentCategory } from './types'

type CategoryManagementPageProps = {
  type: CategoryType
  title: string
  description: string
  showLogo?: boolean
}

type PendingUpload = {
  categoryId?: string
  field: 'logo' | 'backgroundImage'
}

export function CategoryManagementPage({
  type,
  title,
  description,
  showLogo = false,
}: CategoryManagementPageProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [createLogo, setCreateLogo] = useState('')
  const [createBackground, setCreateBackground] = useState('')
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const queryKey = ['admin-categories', type]
  const categories = useQuery({
    queryKey,
    queryFn: () => categoriesApi.list(type),
  })
  const createCategory = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  const updateCategory = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: {
        name?: string
        logo?: string | null
        backgroundImage?: string | null
        sortOrder?: number
      }
    }) => categoriesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  const removeCategory = useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  if (categories.isError) throw categories.error
  if (createCategory.isError) throw createCategory.error
  if (updateCategory.isError) throw updateCategory.error
  if (removeCategory.isError) throw removeCategory.error

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const sortOrder = Number(formData.get('sortOrder') ?? 0)
    if (!name) return

    createCategory.mutate({
      type,
      name,
      logo: showLogo ? createLogo || null : null,
      backgroundImage: createBackground || null,
      sortOrder,
    })
    form.reset()
    setCreateLogo('')
    setCreateBackground('')
  }

  function edit(category: ContentCategory) {
    const nextName = window.prompt('分类名称', category.name)?.trim()
    if (!nextName) return
    updateCategory.mutate({
      id: category.id,
      payload: { name: nextName, sortOrder: category.sortOrder },
    })
  }

  function startUpload(field: PendingUpload['field'], categoryId?: string) {
    setPendingUpload({ field, categoryId })
    fileInputRef.current?.click()
  }

  async function upload(file: File) {
    if (!pendingUpload) return
    try {
      const image = await uploadsApi.image(file)
      if (!pendingUpload.categoryId) {
        if (pendingUpload.field === 'logo') setCreateLogo(image.url)
        if (pendingUpload.field === 'backgroundImage') setCreateBackground(image.url)
        return
      }

      updateCategory.mutate({
        id: pendingUpload.categoryId,
        payload: { [pendingUpload.field]: image.url },
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片上传失败')
    } finally {
      setPendingUpload(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const rows = categories.data ?? []

  return (
    <PageShell title={title} description={description}>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/gif'
        className='hidden'
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) void upload(file)
        }}
      />
      <div className='grid gap-6 lg:grid-cols-[360px_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle>新建分类</CardTitle>
            <CardDescription>新分类会出现在对应内容表单的分类建议里。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>名称</Label>
                <Input id='name' name='name' required />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='sortOrder'>排序</Label>
                <Input id='sortOrder' name='sortOrder' type='number' defaultValue='0' />
              </div>
              {showLogo ? (
                <MediaPicker
                  label='Logo'
                  value={createLogo}
                  onUpload={() => startUpload('logo')}
                  onRemove={() => setCreateLogo('')}
                />
              ) : null}
              <MediaPicker
                label='背景图'
                value={createBackground}
                onUpload={() => startUpload('backgroundImage')}
                onRemove={() => setCreateBackground('')}
              />
              <Button disabled={createCategory.isPending}>
                <Plus />
                添加分类
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>全部分类</CardTitle>
            <CardDescription>改名会同步更新已有内容；删除会清空已有内容的该分类。</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  {showLogo ? <TableHead>Logo</TableHead> : null}
                  <TableHead>背景图</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead className='w-32 text-right'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className='font-medium'>
                      {category.name}
                      <Badge variant='outline' className='ms-2'>
                        {type === 'POST' ? '文章' : '友链'}
                      </Badge>
                    </TableCell>
                    {showLogo ? (
                      <TableCell>
                        <CategoryImage
                          value={category.logo}
                          onUpload={() => startUpload('logo', category.id)}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <CategoryImage
                        value={category.backgroundImage}
                        wide
                        onUpload={() => startUpload('backgroundImage', category.id)}
                      />
                    </TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell className='text-right'>
                      <Button variant='ghost' size='icon' onClick={() => edit(category)}>
                        <Pencil />
                        <span className='sr-only'>编辑</span>
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => removeCategory.mutate(category.id)}
                      >
                        <Trash2 />
                        <span className='sr-only'>删除</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

function MediaPicker({
  label,
  value,
  onUpload,
  onRemove,
}: {
  label: string
  value?: string | null
  onUpload: () => void
  onRemove: () => void
}) {
  return (
    <div className='grid gap-2'>
      <Label>{label}</Label>
      {value ? (
        <img
          src={resolveAssetUrl(value)}
          alt=''
          className='aspect-video w-full rounded-md border object-cover'
        />
      ) : null}
      <div className='flex gap-2'>
        <Button type='button' variant='outline' onClick={onUpload}>
          <ImagePlus />
          {value ? '更换图片' : '上传图片'}
        </Button>
        {value ? (
          <Button type='button' variant='ghost' onClick={onRemove}>
            移除
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function CategoryImage({
  value,
  wide,
  onUpload,
}: {
  value?: string | null
  wide?: boolean
  onUpload: () => void
}) {
  return (
    <button
      type='button'
      className='group flex items-center gap-2 text-sm text-muted-foreground'
      onClick={onUpload}
    >
      {value ? (
        <img
          src={resolveAssetUrl(value)}
          alt=''
          className={
            wide
              ? 'h-10 w-20 rounded-md border object-cover'
              : 'h-10 w-10 rounded-md border object-cover'
          }
        />
      ) : (
        <span className='grid h-10 w-10 place-items-center rounded-md border'>
          <ImagePlus className='size-4' />
        </span>
      )}
      <span className='group-hover:text-foreground'>{value ? '更换' : '上传'}</span>
    </button>
  )
}
