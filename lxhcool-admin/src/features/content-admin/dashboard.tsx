import { useQuery } from '@tanstack/react-query'
import { FileText, FolderKanban, Link as LinkIcon, MessageCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageShell } from './components/page-shell'
import { friendLinksApi, postsApi, projectsApi } from './api'

export function ContentDashboard() {
  const articles = useQuery({
    queryKey: ['admin-posts', 'ARTICLE'],
    queryFn: () => postsApi.list('ARTICLE'),
  })
  const moments = useQuery({
    queryKey: ['admin-posts', 'MOMENT'],
    queryFn: () => postsApi.list('MOMENT'),
  })
  const projects = useQuery({
    queryKey: ['admin-projects'],
    queryFn: projectsApi.list,
  })
  const friendLinks = useQuery({
    queryKey: ['admin-friend-links'],
    queryFn: friendLinksApi.list,
  })

  if (articles.isError) throw articles.error
  if (moments.isError) throw moments.error
  if (projects.isError) throw projects.error
  if (friendLinks.isError) throw friendLinks.error

  const cards = [
    {
      title: '动态',
      value: moments.data?.length ?? 0,
      icon: MessageCircle,
      note: '类似朋友圈的文字、照片、音乐和视频内容',
    },
    {
      title: '文章',
      value: articles.data?.length ?? 0,
      icon: FileText,
      note: '普通长文章，包含草稿、隐藏和已发布内容',
    },
    {
      title: '项目',
      value: projects.data?.length ?? 0,
      icon: FolderKanban,
      note: '通过后台接口管理的项目内容',
    },
    {
      title: '友链',
      value: friendLinks.data?.length ?? 0,
      icon: LinkIcon,
      note: '包含可见和隐藏友链',
    },
  ]

  return (
    <PageShell
      title='内容控制台'
      description='管理 lxhcoool.cn 前台展示的公开内容。'
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{card.title}</CardTitle>
              <card.icon className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{card.value}</div>
              <p className='text-xs text-muted-foreground'>{card.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}
