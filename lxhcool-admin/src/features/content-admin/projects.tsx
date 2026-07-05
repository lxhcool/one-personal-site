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
import { StatusBadge } from './components/status-badge'
import { projectsApi } from './api'

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const projects = useQuery({
    queryKey: ['admin-projects'],
    queryFn: projectsApi.list,
  })
  const removeProject = useMutation({
    mutationFn: projectsApi.remove,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] }),
  })

  if (projects.isError) throw projects.error
  if (removeProject.isError) throw removeProject.error

  return (
    <PageShell
      title='项目'
      description='管理前台展示的作品项目。'
      actions={
        <Button asChild>
          <Link to='/projects/new'>
            <Plus />
            新建项目
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>全部项目</CardTitle>
          <CardDescription>设置为精选的项目会展示在前台首页。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>别名</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>精选</TableHead>
                <TableHead>排序</TableHead>
                <TableHead className='w-28 text-right'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(projects.data ?? []).map((project) => (
                <TableRow key={project.id}>
                  <TableCell className='font-medium'>
                    <Link
                      to='/projects/$projectId/edit'
                      params={{ projectId: project.id }}
                    >
                      {project.title}
                    </Link>
                  </TableCell>
                  <TableCell>{project.slug}</TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>
                    {project.featured ? <Badge>精选</Badge> : '-'}
                  </TableCell>
                  <TableCell>{project.sortOrder}</TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => removeProject.mutate(project.id)}
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
