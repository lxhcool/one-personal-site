import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageShell } from './components/page-shell'
import { StatusBadge } from './components/status-badge'
import { postsApi } from './api'
import type { PostType } from './types'

export function PostsPage({
  type = 'ARTICLE',
}: {
  type?: PostType
}) {
  const queryClient = useQueryClient()
  const isMoment = type === 'MOMENT'
  const posts = useQuery({
    queryKey: ['admin-posts', type],
    queryFn: () => postsApi.list(type),
  })
  const removePost = useMutation({
    mutationFn: postsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-posts'] }),
  })

  if (posts.isError) throw posts.error
  if (removePost.isError) throw removePost.error

  return (
    <PageShell
      title={isMoment ? '动态' : '文章'}
      description={isMoment ? '发布类似朋友圈的文字、照片、音乐和视频动态。' : '创建、发布、隐藏和更新普通长文章。'}
      actions={
        <Button asChild>
          <Link to={isMoment ? '/moments/new' : '/posts/new'}>
            <Plus />
            {isMoment ? '新建动态' : '新建文章'}
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{isMoment ? '全部动态' : '全部文章'}</CardTitle>
          <CardDescription>
            前台只展示状态为“已发布”的内容。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>别名</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead className='w-28 text-right'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(posts.data ?? []).map((post) => (
                <TableRow key={post.id}>
                  <TableCell className='font-medium'>
                    <Link
                      to={isMoment ? '/moments/$postId/edit' : '/posts/$postId/edit'}
                      params={{ postId: post.id }}
                    >
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>{post.category ?? '-'}</TableCell>
                  <TableCell>{post.slug}</TableCell>
                  <TableCell>
                    <StatusBadge status={post.status} />
                  </TableCell>
                  <TableCell>{post.publishedAt ?? '-'}</TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => removePost.mutate(post.id)}
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
    </PageShell>
  )
}
