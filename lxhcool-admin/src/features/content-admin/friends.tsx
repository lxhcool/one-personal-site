import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { friendLinksApi } from './api'

export function FriendsPage() {
  const queryClient = useQueryClient()
  const friendLinks = useQuery({
    queryKey: ['admin-friend-links'],
    queryFn: friendLinksApi.list,
  })
  const removeFriendLink = useMutation({
    mutationFn: friendLinksApi.remove,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-friend-links'] }),
  })

  if (friendLinks.isError) throw friendLinks.error
  if (removeFriendLink.isError) throw removeFriendLink.error

  return (
    <PageShell
      title='友链'
      description='管理前台友链页面展示的外部链接。'
      actions={
        <Button asChild>
          <Link to='/friends/new'>
            <Plus />
            新建友链
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>全部友链</CardTitle>
          <CardDescription>前台只展示设置为可见的友链。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>链接</TableHead>
                <TableHead>可见性</TableHead>
                <TableHead>排序</TableHead>
                <TableHead className='w-28 text-right'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(friendLinks.data ?? []).map((friendLink) => (
                <TableRow key={friendLink.id}>
                  <TableCell className='font-medium'>
                    <Link
                      to='/friends/$friendId/edit'
                      params={{ friendId: friendLink.id }}
                    >
                      {friendLink.name}
                    </Link>
                  </TableCell>
                  <TableCell>{friendLink.category ?? '-'}</TableCell>
                  <TableCell>{friendLink.url}</TableCell>
                  <TableCell>
                    <Badge variant={friendLink.isVisible ? 'default' : 'outline'}>
                      {friendLink.isVisible ? '可见' : '隐藏'}
                    </Badge>
                  </TableCell>
                  <TableCell>{friendLink.sortOrder}</TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => removeFriendLink.mutate(friendLink.id)}
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
