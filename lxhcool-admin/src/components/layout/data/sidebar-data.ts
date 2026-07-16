import {
  FileText,
  FolderKanban,
  Images,
  LayoutDashboard,
  Link as LinkIcon,
  MessageCircle,
  Music2,
  Puzzle,
  Tags,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '管理员',
    email: 'admin@lxhcoool.cn',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'lxhcoool.cn',
      logo: LayoutDashboard,
      plan: '内容管理后台',
    },
  ],
  navGroups: [
    {
      title: '内容管理',
      items: [
        {
          title: '控制台',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: '动态',
          icon: MessageCircle,
          items: [
            {
              title: '全部动态',
              url: '/moments',
            },
            {
              title: '新建动态',
              url: '/moments/new',
            },
          ],
        },
        {
          title: '文章',
          icon: FileText,
          items: [
            {
              title: '全部文章',
              url: '/posts',
            },
            {
              title: '新建文章',
              url: '/posts/new',
            },
            {
              title: '文章分类',
              url: '/posts/categories',
              icon: Tags,
            },
          ],
        },
        {
          title: '项目',
          url: '/projects',
          icon: FolderKanban,
        },
        {
          title: '小工具',
          url: '/widgets',
          icon: Puzzle,
        },
        {
          title: '音乐播放器',
          url: '/music',
          icon: Music2,
        },
        {
          title: '照片墙',
          url: '/gallery',
          icon: Images,
        },
        {
          title: '友链',
          icon: LinkIcon,
          items: [
            {
              title: '全部友链',
              url: '/friends',
            },
            {
              title: '新建友链',
              url: '/friends/new',
            },
            {
              title: '友链分类',
              url: '/friends/categories',
              icon: Tags,
            },
          ],
        },
      ],
    },
  ],
}
