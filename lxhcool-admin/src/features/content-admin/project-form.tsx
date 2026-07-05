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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageShell } from './components/page-shell'
import { optionalString, projectsApi, toStringList } from './api'
import type { PublishStatus } from './types'

export function ProjectFormPage({ projectId }: { projectId?: string }) {
  const navigate = useNavigate()
  const project = useQuery({
    queryKey: ['admin-project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: Boolean(projectId),
  })
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      projectId
        ? projectsApi.update(projectId, payload)
        : projectsApi.create(payload),
    onSuccess: () => navigate({ to: '/projects' }),
  })

  useEffect(() => {
    if (project.isError) throw project.error
    if (mutation.isError) throw mutation.error
  }, [mutation.error, mutation.isError, project.error, project.isError])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    mutation.mutate({
      title: String(formData.get('title') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      excerpt: optionalString(formData.get('excerpt')),
      content: optionalString(formData.get('content')),
      coverImage: optionalString(formData.get('coverImage')),
      gallery: toStringList(formData.get('gallery')),
      techStack: toStringList(formData.get('techStack')),
      liveUrl: optionalString(formData.get('liveUrl')),
      githubUrl: optionalString(formData.get('githubUrl')),
      featured: formData.get('featured') === 'on',
      sortOrder: Number(formData.get('sortOrder') ?? 0),
      status: String(formData.get('status') ?? 'PUBLISHED') as PublishStatus,
      seoTitle: optionalString(formData.get('seoTitle')),
      seoDescription: optionalString(formData.get('seoDescription')),
      ogImage: optionalString(formData.get('ogImage')),
    })
  }

  const value = project.data

  return (
    <PageShell
      title={projectId ? '编辑项目' : '新建项目'}
      description='项目默认发布，如需草稿或隐藏请手动选择状态。'
    >
      <form onSubmit={onSubmit} className='grid gap-6 lg:grid-cols-[1fr_320px]'>
        <Card>
          <CardHeader>
            <CardTitle>内容</CardTitle>
            <CardDescription>前台项目详情页展示的主要字段。</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <Field name='title' label='标题' defaultValue={value?.title} required />
            <Field name='slug' label='别名' defaultValue={value?.slug} required />
            <Field name='excerpt' label='摘要' defaultValue={value?.excerpt} />
            <div className='grid gap-2'>
              <Label htmlFor='content'>正文</Label>
              <Textarea
                id='content'
                name='content'
                defaultValue={value?.content ?? ''}
                className='min-h-72'
              />
            </div>
          </CardContent>
        </Card>

        <div className='grid content-start gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <div className='grid gap-2'>
                <Label>状态</Label>
                <Select name='status' defaultValue={value?.status ?? 'PUBLISHED'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PUBLISHED'>已发布</SelectItem>
                    <SelectItem value='DRAFT'>草稿</SelectItem>
                    <SelectItem value='HIDDEN'>隐藏</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field
                name='sortOrder'
                label='排序'
                type='number'
                defaultValue={String(value?.sortOrder ?? 0)}
              />
              <label className='flex items-center gap-2 text-sm font-medium'>
                <Checkbox name='featured' defaultChecked={value?.featured} />
                精选
              </label>
              <Button disabled={mutation.isPending}>
                <Save />
                保存项目
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>链接与元信息</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <Field name='coverImage' label='封面图 URL' defaultValue={value?.coverImage} />
              <Field name='gallery' label='图库 URL' defaultValue={value?.gallery.join(', ')} />
              <Field
                name='techStack'
                label='技术栈'
                defaultValue={value?.techStack.join(', ')}
              />
              <Field name='liveUrl' label='线上地址' defaultValue={value?.liveUrl} />
              <Field name='githubUrl' label='GitHub 地址' defaultValue={value?.githubUrl} />
              <Field name='seoTitle' label='SEO 标题' defaultValue={value?.seoTitle} />
              <Field
                name='seoDescription'
                label='SEO 描述'
                defaultValue={value?.seoDescription}
              />
              <Field name='ogImage' label='OG 图片 URL' defaultValue={value?.ogImage} />
            </CardContent>
          </Card>
        </div>
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
}: {
  name: string
  label: string
  defaultValue?: string | null
  required?: boolean
  type?: string
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
      />
    </div>
  )
}
