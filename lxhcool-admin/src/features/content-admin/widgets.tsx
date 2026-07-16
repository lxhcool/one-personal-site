import { useState } from 'react'
import { CSS } from '@dnd-kit/utilities'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  GripVertical,
  Link2,
  Music2,
  Quote,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageShell } from './components/page-shell'
import { musicApi, uploadsApi, widgetsApi } from './api'
import type { SiteWidget, WidgetArea, WidgetType } from './types'

const widgetTypes: {
  value: WidgetType
  label: string
  description: string
  template: Record<string, unknown>
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    value: 'MUSIC_PLAYER',
    label: '音乐播放器',
    description: '使用网易云歌单作为首页小工具播放列表。',
    template: { playlist: [], playlistSource: null },
    icon: Music2,
  },
  {
    value: 'HITOKOTO',
    label: '一言',
    description: '从一言接口获取句子，可选分类过滤和背景图。',
    template: { text: '', from: '', categories: [] },
    icon: Quote,
  },
  {
    value: 'FRIEND_LINKS',
    label: '友情链接',
    description: '展示指定分类下可见的友情链接。',
    template: { category: '', limit: 6, random: false },
    icon: Link2,
  },
  {
    value: 'PROFILE',
    label: '个人信息',
    description: '展示封面、头像、昵称、身份和社交链接。',
    template: {
      coverImage: '',
      avatar: '',
      name: '',
      role: '',
      bio: '',
      socials: [],
      stats: [],
    },
    icon: UserRound,
  },
  {
    value: 'DATE_CARD',
    label: '日期卡片',
    description: '展示日期、时间和站点运行信息。',
    template: { showTime: true, siteStartDate: '' },
    icon: CalendarDays,
  },
]

const typeLabels = Object.fromEntries(
  widgetTypes.map((item) => [item.value, item.label])
) as Record<WidgetType, string>

const standaloneWidgetTypes = new Set<WidgetType>(['PHOTO_GALLERY'])

type ActiveDrag =
  | { kind: 'palette'; type: WidgetType }
  | { kind: 'widget'; id: string }
  | null

type PlaylistSource = {
  provider: 'netease'
  url: string
  id?: string
  title?: string
  cover?: string
  trackCount?: number
}

type SocialPlatformKey =
  | 'github'
  | 'gitee'
  | 'douyin'
  | 'xiaohongshu'
  | 'bilibili'
  | 'netease-cloud-music'
  | 'zhihu'
  | 'juejin'
  | 'csdn'
  | 'weibo'
  | 'telegram'
  | 'discord'
  | 'instagram'
  | 'youtube'
  | 'x'
  | 'wechat'
  | 'qq'
  | 'custom'

type SocialConfig = {
  platform: SocialPlatformKey
  label: string
  url: string
  icon: string
  color: string
  qrCode: string
  enabled: boolean
}

const socialPlatforms: Array<{
  key: SocialPlatformKey
  label: string
  icon: string
  color: string
  placeholder: string
  qrCode?: boolean
}> = [
  {
    key: 'github',
    label: 'GitHub',
    icon: 'github',
    color: '#181717',
    placeholder: 'https://github.com/username',
  },
  {
    key: 'gitee',
    label: 'Gitee',
    icon: 'gitee',
    color: '#C71D23',
    placeholder: 'https://gitee.com/username',
  },
  {
    key: 'douyin',
    label: '抖音',
    icon: 'tiktok',
    color: '#000000',
    placeholder: 'https://www.douyin.com/user/...',
    qrCode: true,
  },
  {
    key: 'xiaohongshu',
    label: '小红书',
    icon: 'xiaohongshu',
    color: '#FF2442',
    placeholder: 'https://www.xiaohongshu.com/user/profile/...',
    qrCode: true,
  },
  {
    key: 'bilibili',
    label: '哔哩哔哩',
    icon: 'bilibili',
    color: '#00A1D6',
    placeholder: 'https://space.bilibili.com/...',
  },
  {
    key: 'netease-cloud-music',
    label: '网易云音乐',
    icon: 'neteasecloudmusic',
    color: '#D43C33',
    placeholder: 'https://music.163.com/#/user/home?id=...',
  },
  {
    key: 'zhihu',
    label: '知乎',
    icon: 'zhihu',
    color: '#0084FF',
    placeholder: 'https://www.zhihu.com/people/...',
  },
  {
    key: 'juejin',
    label: '掘金',
    icon: 'juejin',
    color: '#1E80FF',
    placeholder: 'https://juejin.cn/user/...',
  },
  {
    key: 'csdn',
    label: 'CSDN',
    icon: 'csdn',
    color: '#FC5531',
    placeholder: 'https://blog.csdn.net/...',
  },
  {
    key: 'weibo',
    label: '微博',
    icon: 'sinaweibo',
    color: '#E6162D',
    placeholder: 'https://weibo.com/...',
    qrCode: true,
  },
  {
    key: 'telegram',
    label: 'Telegram',
    icon: 'telegram',
    color: '#26A5E4',
    placeholder: 'https://t.me/username',
  },
  {
    key: 'discord',
    label: 'Discord',
    icon: 'discord',
    color: '#5865F2',
    placeholder: 'https://discord.gg/...',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    placeholder: 'https://www.instagram.com/username',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    placeholder: 'https://www.youtube.com/@username',
  },
  {
    key: 'x',
    label: 'X',
    icon: 'x',
    color: '#000000',
    placeholder: 'https://x.com/username',
  },
  {
    key: 'wechat',
    label: '微信',
    icon: 'wechat',
    color: '#07C160',
    placeholder: '微信主页链接或留空',
    qrCode: true,
  },
  {
    key: 'qq',
    label: 'QQ',
    icon: 'tencentqq',
    color: '#1EBAFC',
    placeholder: 'QQ 主页链接或留空',
    qrCode: true,
  },
  {
    key: 'custom',
    label: '自定义',
    icon: '',
    color: '#111827',
    placeholder: 'https://example.com',
    qrCode: true,
  },
]

export function WidgetsPage() {
  const queryClient = useQueryClient()
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )
  const widgets = useQuery({
    queryKey: ['admin-widgets'],
    queryFn: widgetsApi.list,
  })
  const createWidget = useMutation({
    mutationFn: widgetsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-widgets'] }),
  })
  const updateLayout = useMutation({
    mutationFn: async (items: SiteWidget[]) => {
      const left = items.filter((widget) => widget.area === 'LEFT')
      const right = items.filter((widget) => widget.area === 'RIGHT')
      await Promise.all(
        [...left, ...right].map((widget) => {
          const areaItems = widget.area === 'LEFT' ? left : right
          const index = areaItems.findIndex((item) => item.id === widget.id)
          return widgetsApi.update(widget.id, {
            area: widget.area,
            sortOrder: index,
          })
        })
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-widgets'] }),
  })
  const removeWidget = useMutation({
    mutationFn: widgetsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-widgets'] }),
  })
  const updateWidget = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      widgetsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-widgets'] }),
  })

  if (widgets.isError) throw widgets.error
  if (createWidget.isError) throw createWidget.error
  if (updateLayout.isError) throw updateLayout.error
  if (removeWidget.isError) throw removeWidget.error
  if (updateWidget.isError) throw updateWidget.error

  const rows = [...(widgets.data ?? [])]
    .filter((widget) => !standaloneWidgetTypes.has(widget.type))
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.updatedAt.localeCompare(b.updatedAt)
    )
  const leftWidgets = rows.filter((widget) => widget.area === 'LEFT')
  const rightWidgets = rows.filter((widget) => widget.area === 'RIGHT')
  const usedTypes = new Set(rows.map((widget) => widget.type))

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as ActiveDrag | undefined
    if (data?.kind === 'palette' && usedTypes.has(data.type)) {
      setActiveDrag(null)
      return
    }
    setActiveDrag(data ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDrag(null)
    if (!over) return

    const data = active.data.current as ActiveDrag | undefined
    const overId = String(over.id)
    const overWidget = rows.find((widget) => widget.id === overId)
    const targetArea = (overId === 'LEFT' || overId === 'RIGHT'
      ? overId
      : overWidget?.area) as WidgetArea | undefined

    if (!targetArea) return

    if (data?.kind === 'palette') {
      if (usedTypes.has(data.type)) return

      const template = widgetTypes.find((item) => item.value === data.type)
      const targetCount = targetArea === 'LEFT' ? leftWidgets.length : rightWidgets.length

      createWidget.mutate({
        area: targetArea,
        type: data.type,
        title: template?.label,
        enabled: true,
        sortOrder: targetCount,
        config: template?.template ?? {},
      })
      return
    }

    if (active.id === over.id) return

    const activeWidget = rows.find((widget) => widget.id === active.id)
    if (!activeWidget) return

    const nextLeft = leftWidgets.filter((widget) => widget.id !== activeWidget.id)
    const nextRight = rightWidgets.filter((widget) => widget.id !== activeWidget.id)
    const targetList = targetArea === 'LEFT' ? nextLeft : nextRight
    const overIndex = overWidget
      ? Math.max(
          0,
          targetList.findIndex((widget) => widget.id === overWidget.id)
        )
      : targetList.length
    const insertIndex = overIndex === -1 ? targetList.length : overIndex
    const movedWidget = { ...activeWidget, area: targetArea }

    targetList.splice(insertIndex, 0, movedWidget)
    updateLayout.mutate([...nextLeft, ...nextRight])
  }

  const activePalette =
    activeDrag?.kind === 'palette'
      ? widgetTypes.find((item) => item.value === activeDrag.type)
      : null
  const activeWidget =
    activeDrag?.kind === 'widget'
      ? rows.find((widget) => widget.id === activeDrag.id)
      : null

  return (
    <PageShell
      title='小工具'
      description='拖拽组件到前台左侧或右侧栏，也可以继续拖拽调整顺序。'
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        <div className='grid gap-6 xl:grid-cols-[320px_1fr]'>
          <WidgetPalette creating={createWidget.isPending} usedTypes={usedTypes} />

          <div className='grid gap-4 lg:grid-cols-2'>
            <WidgetAreaColumn
              area='LEFT'
              title='左侧小工具'
              widgets={leftWidgets}
              removingId={removeWidget.variables}
              updatingId={updateWidget.isPending ? updateWidget.variables?.id : undefined}
              isPaletteDragging={activeDrag?.kind === 'palette'}
              onRemove={(id) => removeWidget.mutate(id)}
              onUpdate={(id, payload) => updateWidget.mutate({ id, payload })}
            />
            <WidgetAreaColumn
              area='RIGHT'
              title='右侧小工具'
              widgets={rightWidgets}
              removingId={removeWidget.variables}
              updatingId={updateWidget.isPending ? updateWidget.variables?.id : undefined}
              isPaletteDragging={activeDrag?.kind === 'palette'}
              onRemove={(id) => removeWidget.mutate(id)}
              onUpdate={(id, payload) => updateWidget.mutate({ id, payload })}
            />
          </div>
        </div>

        <DragOverlay>
          {activePalette ? <PalettePreview item={activePalette} /> : null}
          {activeWidget ? <WidgetCardPreview widget={activeWidget} /> : null}
        </DragOverlay>
      </DndContext>
    </PageShell>
  )
}

function WidgetPalette({
  creating,
  usedTypes,
}: {
  creating: boolean
  usedTypes: Set<WidgetType>
}) {
  return (
    <Card className='h-fit'>
      <CardHeader>
        <CardTitle>组件库</CardTitle>
        <CardDescription>拖拽组件到栏目中即可创建。</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3'>
        {widgetTypes.map((item) => (
          <PaletteDraggableItem
            key={item.value}
            item={item}
            disabled={creating || usedTypes.has(item.value)}
            used={usedTypes.has(item.value)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function PaletteDraggableItem({
  item,
  disabled,
  used,
}: {
  item: (typeof widgetTypes)[number]
  disabled: boolean
  used: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.value}`,
    data: { kind: 'palette', type: item.value } satisfies ActiveDrag,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group cursor-grab rounded-md border bg-background p-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      } ${disabled ? 'pointer-events-none cursor-not-allowed opacity-55 hover:translate-y-0 hover:border-border hover:shadow-xs' : ''}`}
    >
      <PalettePreview item={item} used={used} />
    </div>
  )
}

function PalettePreview({
  item,
  used = false,
}: {
  item: (typeof widgetTypes)[number]
  used?: boolean
}) {
  const Icon = item.icon

  return (
    <div className='flex items-start gap-3'>
      <div className='rounded-md bg-primary/10 p-2 text-primary transition-transform duration-200 group-hover:scale-105'>
        <Icon className='size-4' />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <div className='font-medium'>{item.label}</div>
          {used ? (
            <Badge variant='secondary' className='shrink-0'>
              已添加
            </Badge>
          ) : null}
        </div>
        <div className='mt-1 text-xs leading-5 text-muted-foreground'>
          {item.description}
        </div>
      </div>
      <GripVertical className='mt-2 size-4 text-muted-foreground opacity-60' />
    </div>
  )
}

function WidgetAreaColumn({
  area,
  title,
  widgets,
  removingId,
  updatingId,
  isPaletteDragging,
  onRemove,
  onUpdate,
}: {
  area: WidgetArea
  title: string
  widgets: SiteWidget[]
  removingId?: string
  updatingId?: string
  isPaletteDragging: boolean
  onRemove: (id: string) => void
  onUpdate: (id: string, payload: Record<string, unknown>) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: area })

  return (
    <Card
      className={`transition-all duration-200 ${
        isOver
          ? 'border-primary ring-2 ring-primary/20'
          : isPaletteDragging
            ? 'border-dashed border-primary/40'
            : ''
      }`}
    >
      <CardHeader>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>拖拽卡片可排序，也可以移动到另一侧。</CardDescription>
          </div>
          <Badge variant='secondary'>{widgets.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <SortableContext
          id={area}
          items={widgets.map((widget) => widget.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setNodeRef}
            className={`grid min-h-56 content-start gap-3 rounded-md transition-colors duration-200 ${
              isOver ? 'bg-primary/5 p-2' : 'p-0'
            }`}
          >
            {widgets.length === 0 ? (
              <div
                className={`flex min-h-40 items-center justify-center rounded-md border border-dashed p-6 text-center text-sm transition-all duration-200 ${
                  isOver
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                拖到这里
              </div>
            ) : null}
            {widgets.map((widget) => (
              <SortableWidgetCard
                key={widget.id}
                widget={widget}
                removing={removingId === widget.id}
                updating={updatingId === widget.id}
                onRemove={() => onRemove(widget.id)}
                onUpdate={(payload) => onUpdate(widget.id, payload)}
              />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  )
}

function SortableWidgetCard({
  widget,
  removing,
  updating,
  onRemove,
  onUpdate,
}: {
  widget: SiteWidget
  removing: boolean
  updating: boolean
  onRemove: () => void
  onUpdate: (payload: Record<string, unknown>) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    data: { kind: 'widget', id: widget.id } satisfies ActiveDrag,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border bg-background p-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className='flex items-start gap-3'>
        <button
          type='button'
          className='mt-1 cursor-grab text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing'
          {...attributes}
          {...listeners}
          aria-label='Drag to sort'
        >
          <GripVertical className='size-4' />
        </button>
        <div className='min-w-0 flex-1'>
          <div className='truncate font-medium'>{widget.title || typeLabels[widget.type]}</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            {typeLabels[widget.type]} / {widget.enabled ? '已启用' : '已停用'}
          </div>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          disabled={removing}
          onClick={onRemove}
        >
          <Trash2 />
          <span className='sr-only'>删除</span>
        </Button>
      </div>
      {widget.type === 'MUSIC_PLAYER' ? (
        <MusicPlaylistEditor widget={widget} updating={updating} onUpdate={onUpdate} />
      ) : null}
      {widget.type === 'HITOKOTO' ? (
        <HitokotoCompactEditor widget={widget} updating={updating} onUpdate={onUpdate} />
      ) : null}
      {widget.type === 'PROFILE' ? (
        <ProfileEditor widget={widget} updating={updating} onUpdate={onUpdate} />
      ) : null}
    </div>
  )
}

function WidgetCardPreview({ widget }: { widget: SiteWidget }) {
  return (
    <div className='w-72 rounded-md border bg-background p-3 shadow-lg'>
      <div className='flex items-start gap-3'>
        <GripVertical className='mt-1 size-4 text-muted-foreground' />
        <div className='min-w-0 flex-1'>
          <div className='truncate font-medium'>{widget.title || typeLabels[widget.type]}</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            {typeLabels[widget.type]} / {widget.enabled ? '已启用' : '已停用'}
          </div>
        </div>
      </div>
    </div>
  )
}

function MusicPlaylistEditor({
  widget,
  updating,
  onUpdate,
}: {
  widget: SiteWidget
  updating: boolean
  onUpdate: (payload: Record<string, unknown>) => void
}) {
  const [playlistSource, setPlaylistSource] = useState<PlaylistSource | null>(() =>
    readPlaylistSource(widget.config)
  )
  const [neteaseUrl, setNeteaseUrl] = useState(() => playlistSource?.url ?? '')
  const [fetching, setFetching] = useState(false)

  async function validateNeteasePlaylist() {
    const url = neteaseUrl.trim()
    if (!url) return
    if (!isNeteasePlaylistUrl(url)) {
      window.alert('请输入网易云歌单链接。')
      return
    }

    setFetching(true)
    try {
      const playlistData = await musicApi.neteasePlaylist(url)
      setPlaylistSource({
        provider: 'netease',
        url,
        id: playlistData.id,
        title: playlistData.title,
        cover: playlistData.cover,
        trackCount: playlistData.trackCount || playlistData.tracks.length,
      })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '歌单加载失败。')
    } finally {
      setFetching(false)
    }
  }

  function savePlaylist() {
    const url = neteaseUrl.trim()
    onUpdate({
      config: {
        ...widget.config,
        playlistSource: playlistSource ?? (url ? { provider: 'netease', url } : null),
      },
    })
  }

  return (
    <div className='mt-4 grid gap-3 border-t pt-4'>
      <div className='grid gap-2'>
        <Label htmlFor={`netease-${widget.id}`}>网易云歌单链接</Label>
        <div className='flex gap-2'>
          <Input
            id={`netease-${widget.id}`}
            value={neteaseUrl}
            onChange={(event) => setNeteaseUrl(event.currentTarget.value)}
            placeholder='https://music.163.com/#/playlist?id=...'
          />
          <Button
            type='button'
            variant='outline'
            disabled={fetching}
            onClick={validateNeteasePlaylist}
          >
            {fetching ? '加载中' : '校验'}
          </Button>
        </div>
      </div>

      {playlistSource ? (
        <div className='rounded-md border bg-muted/30 p-3 text-sm'>
          <div className='font-medium'>{playlistSource.title || '网易云歌单'}</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            {playlistSource.trackCount
              ? `${playlistSource.trackCount} 首歌曲`
              : '已配置歌单来源'}
          </div>
        </div>
      ) : null}

      <Button type='button' disabled={updating} onClick={savePlaylist}>
        {updating ? '保存中' : '保存歌单'}
      </Button>
    </div>
  )
}

function HitokotoCompactEditor({
  widget,
  updating,
  onUpdate,
}: {
  widget: SiteWidget
  updating: boolean
  onUpdate: (payload: Record<string, unknown>) => void
}) {
  const hasLegacyBackground = Boolean(readConfigString(widget.config, 'backgroundImage'))

  function clearHitokotoBackground() {
    const nextConfig = { ...widget.config }
    delete nextConfig.backgroundImage
    onUpdate({ config: nextConfig })
  }

  return (
    <div className='mt-4 grid gap-3 border-t pt-4'>
      <div className='rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground'>
        一言卡片不再使用背景图。
      </div>

      {hasLegacyBackground ? (
        <Button type='button' variant='outline' disabled={updating} onClick={clearHitokotoBackground}>
          {updating ? '保存中' : '清除旧背景图配置'}
        </Button>
      ) : null}
    </div>
  )
}

function HitokotoEditor({
  widget,
  updating,
  onUpdate,
}: {
  widget: SiteWidget
  updating: boolean
  onUpdate: (payload: Record<string, unknown>) => void
}) {
  const [backgroundImage, setBackgroundImage] = useState(() =>
    readConfigString(widget.config, 'backgroundImage')
  )
  const [uploading, setUploading] = useState(false)

  async function uploadBackground(file: File | undefined) {
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadsApi.image(file)
      setBackgroundImage(result.url)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '图片上传失败。')
    } finally {
      setUploading(false)
    }
  }

  function saveHitokoto() {
    onUpdate({
      config: {
        ...widget.config,
        backgroundImage: backgroundImage.trim(),
      },
    })
  }

  return (
    <div className='mt-4 grid gap-3 border-t pt-4'>
      <div className='grid gap-2'>
        <Label htmlFor={`hitokoto-bg-${widget.id}`}>背景图</Label>
        <Input
          id={`hitokoto-bg-${widget.id}`}
          type='file'
          accept='image/jpeg,image/png,image/webp,image/gif'
          disabled={uploading}
          onChange={(event) => void uploadBackground(event.currentTarget.files?.[0])}
        />
      </div>

      {backgroundImage ? (
        <div className='overflow-hidden rounded-md border bg-muted/30'>
          <img
            src={backgroundImage}
            alt=''
            className='h-32 w-full object-cover'
          />
          <div className='truncate px-3 py-2 text-xs text-muted-foreground'>
            {backgroundImage}
          </div>
        </div>
      ) : null}

      <Button type='button' disabled={updating || uploading} onClick={saveHitokoto}>
        {updating ? '保存中' : uploading ? '上传中' : '保存背景图'}
      </Button>
    </div>
  )
}

void HitokotoEditor

function ProfileEditor({
  widget,
  updating,
  onUpdate,
}: {
  widget: SiteWidget
  updating: boolean
  onUpdate: (payload: Record<string, unknown>) => void
}) {
  const [coverImage, setCoverImage] = useState(() =>
    readConfigString(widget.config, 'coverImage')
  )
  const [avatar, setAvatar] = useState(() => readConfigString(widget.config, 'avatar'))
  const [name, setName] = useState(() => readConfigString(widget.config, 'name'))
  const [role, setRole] = useState(() => readConfigString(widget.config, 'role'))
  const [socials, setSocials] = useState<SocialConfig[]>(() =>
    normalizeSocials(widget.config.socials)
  )
  const [selectedSocial, setSelectedSocial] = useState<SocialPlatformKey>(() =>
    normalizeSocials(widget.config.socials).find((item) => item.enabled)?.platform ?? 'github'
  )
  const [uploading, setUploading] = useState<string | null>(null)

  async function uploadProfileImage(
    kind: 'cover' | 'avatar' | `social-${SocialPlatformKey}`,
    file: File | undefined
  ) {
    if (!file) return

    setUploading(kind)
    try {
      const result = await uploadsApi.image(file)
      if (kind === 'cover') {
        setCoverImage(result.url)
      } else if (kind === 'avatar') {
        setAvatar(result.url)
      } else {
        const platform = kind.replace('social-', '') as SocialPlatformKey
        updateSocial(platform, { qrCode: result.url, enabled: true })
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '图片上传失败。')
    } finally {
      setUploading(null)
    }
  }

  function updateSocial(platform: SocialPlatformKey, patch: Partial<SocialConfig>) {
    setSocials((items) =>
      items.map((item) => (item.platform === platform ? { ...item, ...patch } : item))
    )
  }

  function saveProfile() {
    onUpdate({
      config: {
        ...widget.config,
        coverImage: coverImage.trim(),
        avatar: avatar.trim(),
        name: name.trim(),
        role: role.trim(),
        socials: serializeSocials(socials),
        stats: [],
      },
    })
  }

  const activeSocial = socials.find((item) => item.platform === selectedSocial) ?? socials[0]
  const activePlatform = activeSocial
    ? socialPlatforms.find((item) => item.key === activeSocial.platform)
    : undefined

  return (
    <div className='mt-4 grid gap-3 border-t pt-4'>
      <div className='grid gap-2'>
        <Label htmlFor={`profile-name-${widget.id}`}>昵称</Label>
        <Input
          id={`profile-name-${widget.id}`}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          placeholder='Jayvion Simon'
        />
      </div>

      <div className='grid gap-2'>
        <Label htmlFor={`profile-role-${widget.id}`}>身份</Label>
        <Input
          id={`profile-role-${widget.id}`}
          value={role}
          onChange={(event) => setRole(event.currentTarget.value)}
          placeholder='CEO'
        />
      </div>

      <div className='grid gap-2'>
        <Label htmlFor={`profile-cover-${widget.id}`}>封面图</Label>
        <Input
          id={`profile-cover-${widget.id}`}
          type='file'
          accept='image/jpeg,image/png,image/webp,image/gif'
          disabled={uploading === 'cover'}
          onChange={(event) => void uploadProfileImage('cover', event.currentTarget.files?.[0])}
        />
      </div>

      {coverImage ? (
        <img src={coverImage} alt='' className='h-24 w-full rounded-md object-cover' />
      ) : null}

      <div className='grid gap-2'>
        <Label htmlFor={`profile-avatar-${widget.id}`}>头像</Label>
        <Input
          id={`profile-avatar-${widget.id}`}
          type='file'
          accept='image/jpeg,image/png,image/webp,image/gif'
          disabled={uploading === 'avatar'}
          onChange={(event) => void uploadProfileImage('avatar', event.currentTarget.files?.[0])}
        />
      </div>

      {avatar ? (
        <img src={avatar} alt='' className='size-20 rounded-full object-cover' />
      ) : null}

      {activeSocial ? (
        <div className='grid gap-3 rounded-md border bg-muted/20 p-3'>
          <Label>社交信息</Label>
          <div className='flex flex-wrap gap-2'>
            {socials.map((social) => {
              const platform = socialPlatforms.find((item) => item.key === social.platform)
              const label = platform?.label ?? social.label
              const active = social.platform === activeSocial.platform
              return (
                <Button
                  key={social.platform}
                  type='button'
                  variant={active ? 'default' : social.enabled ? 'secondary' : 'outline'}
                  size='sm'
                  onClick={() => setSelectedSocial(social.platform)}
                >
                  {label}
                </Button>
              )
            })}
          </div>

          <div className='grid gap-3 rounded-md border bg-background p-3'>
            <div className='flex items-center gap-2'>
              <Checkbox
                id={`profile-social-compact-enabled-${widget.id}-${activeSocial.platform}`}
                checked={activeSocial.enabled}
                onCheckedChange={(checked) =>
                  updateSocial(activeSocial.platform, { enabled: checked === true })
                }
              />
              <Label htmlFor={`profile-social-compact-enabled-${widget.id}-${activeSocial.platform}`}>
                启用 {activePlatform?.label ?? activeSocial.label}
              </Label>
            </div>

            {activeSocial.platform === 'custom' ? (
              <Input
                value={activeSocial.label}
                onChange={(event) =>
                  updateSocial(activeSocial.platform, { label: event.currentTarget.value })
                }
                placeholder='自定义平台名称'
              />
            ) : null}

            <Input
              value={activeSocial.url}
              onChange={(event) =>
                updateSocial(activeSocial.platform, {
                  url: event.currentTarget.value,
                  enabled: activeSocial.enabled || Boolean(event.currentTarget.value.trim()),
                })
              }
              placeholder={activePlatform?.placeholder ?? 'https://example.com'}
            />

            <div className='flex gap-2'>
              <Input
                type='color'
                value={activeSocial.color}
                onChange={(event) =>
                  updateSocial(activeSocial.platform, { color: event.currentTarget.value })
                }
                className='h-10 w-14 p-1'
              />
              <Input
                value={activeSocial.color}
                onChange={(event) =>
                  updateSocial(activeSocial.platform, { color: event.currentTarget.value })
                }
                placeholder='#111827'
              />
            </div>

            {activePlatform?.qrCode ? (
              <div className='grid gap-2'>
                <Input
                  type='file'
                  accept='image/jpeg,image/png,image/webp,image/gif'
                  disabled={uploading === `social-${activeSocial.platform}`}
                  onChange={(event) =>
                    void uploadProfileImage(
                      `social-${activeSocial.platform}`,
                      event.currentTarget.files?.[0]
                    )
                  }
                />
                {activeSocial.qrCode ? (
                  <img
                    src={activeSocial.qrCode}
                    alt=''
                    className='size-20 rounded-md border object-cover'
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className='hidden'>
        <Label>社交信息</Label>
        {socials.map((social) => {
          const platform = socialPlatforms.find((item) => item.key === social.platform)
          const label = platform?.label ?? social.label
          return (
            <div
              key={social.platform}
              className='grid gap-3 rounded-md border bg-muted/20 p-3'
            >
              <div className='flex items-center gap-2'>
                <Checkbox
                  id={`profile-social-enabled-${widget.id}-${social.platform}`}
                  checked={social.enabled}
                  onCheckedChange={(checked) =>
                    updateSocial(social.platform, { enabled: checked === true })
                  }
                />
                <Label
                  htmlFor={`profile-social-enabled-${widget.id}-${social.platform}`}
                  className='font-medium'
                >
                  {label}
                </Label>
              </div>
              {social.platform === 'custom' ? (
                <Input
                  value={social.label}
                  onChange={(event) =>
                    updateSocial(social.platform, { label: event.currentTarget.value })
                  }
                  placeholder='自定义平台名称'
                />
              ) : null}
              <Input
                value={social.url}
                onChange={(event) =>
                  updateSocial(social.platform, {
                    url: event.currentTarget.value,
                    enabled: social.enabled || Boolean(event.currentTarget.value.trim()),
                  })
                }
                placeholder={platform?.placeholder ?? 'https://example.com'}
              />
              <div className='grid gap-2'>
                <Label htmlFor={`profile-social-color-${widget.id}-${social.platform}`}>
                  图标颜色
                </Label>
                <div className='flex gap-2'>
                  <Input
                    id={`profile-social-color-${widget.id}-${social.platform}`}
                    type='color'
                    value={social.color}
                    onChange={(event) =>
                      updateSocial(social.platform, { color: event.currentTarget.value })
                    }
                    className='h-10 w-14 p-1'
                  />
                  <Input
                    value={social.color}
                    onChange={(event) =>
                      updateSocial(social.platform, { color: event.currentTarget.value })
                    }
                    placeholder='#111827'
                  />
                </div>
              </div>
              {platform?.qrCode ? (
                <div className='grid gap-2'>
                  <Input
                    type='file'
                    accept='image/jpeg,image/png,image/webp,image/gif'
                    disabled={uploading === `social-${social.platform}`}
                    onChange={(event) =>
                      void uploadProfileImage(
                        `social-${social.platform}`,
                        event.currentTarget.files?.[0]
                      )
                    }
                  />
                  {social.qrCode ? (
                    <img
                      src={social.qrCode}
                      alt=''
                      className='size-20 rounded-md border object-cover'
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <Button type='button' disabled={updating || uploading !== null} onClick={saveProfile}>
        {updating ? '保存中' : uploading ? '上传中' : '保存个人信息'}
      </Button>
    </div>
  )
}

function readPlaylistSource(config: Record<string, unknown>) {
  const source = config.playlistSource
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null
  const item = source as Record<string, unknown>
  const provider = readConfigString(item, 'provider')
  const url = readConfigString(item, 'url')
  if (provider !== 'netease' || !url) return null
  const trackCount = item.trackCount

  return {
    provider: 'netease',
    url,
    id: readConfigString(item, 'id') || undefined,
    title: readConfigString(item, 'title') || undefined,
    cover: readConfigString(item, 'cover') || undefined,
    trackCount: typeof trackCount === 'number' ? trackCount : undefined,
  } satisfies PlaylistSource
}

function readConfigString(source: Record<string, unknown>, key: string) {
  const value = source[key]
  return typeof value === 'string' ? value : ''
}

function normalizeSocials(value: unknown): SocialConfig[] {
  const configured = Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object'
      )
    : []

  return socialPlatforms.map((platform) => {
    const item = configured.find(
      (social) =>
        readConfigString(social, 'platform') === platform.key ||
        readConfigString(social, 'icon') === platform.icon
    )
    const url = item ? readConfigString(item, 'url') : ''
    const qrCode = item ? readConfigString(item, 'qrCode') : ''
    const label = item ? readConfigString(item, 'label') || platform.label : platform.label
    const color = item ? readConfigString(item, 'color') || platform.color : platform.color
    return {
      platform: platform.key,
      label,
      url,
      icon: platform.icon || (item ? readConfigString(item, 'icon') : ''),
      color,
      qrCode,
      enabled: Boolean(item && (url || qrCode)),
    }
  })
}

function serializeSocials(value: SocialConfig[]) {
  return value
    .filter((item) => item.enabled && (item.url.trim() || item.qrCode.trim()))
    .map((item) => ({
      platform: item.platform,
      label: item.label.trim(),
      url: item.url.trim(),
      icon: item.icon.trim(),
      color: normalizeHexColor(item.color) || '#111827',
      qrCode: item.qrCode.trim(),
    }))
}

function normalizeHexColor(value: string) {
  const text = value.trim()
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : ''
}

function isNeteasePlaylistUrl(url: string) {
  const text = url.trim()
  if (!text) return false

  try {
    const parsed = new URL(text)
    return /playlist/i.test(`${parsed.pathname}${parsed.hash}`)
  } catch {
    return /playlist/i.test(text)
  }
}
