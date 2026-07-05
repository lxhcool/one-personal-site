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
  Image,
  Link2,
  Music2,
  Quote,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { musicApi, widgetsApi } from './api'
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
    label: 'Music Player',
    description: 'Use a NetEase playlist as the homepage widget playlist.',
    template: { playlist: [], playlistSource: null },
    icon: Music2,
  },
  {
    value: 'HITOKOTO',
    label: 'Quote Card',
    description: 'Show a short quote or sentence.',
    template: { text: '', from: '' },
    icon: Quote,
  },
  {
    value: 'FRIEND_LINKS',
    label: 'Friend Links',
    description: 'Show visible friend links from a category.',
    template: { category: '', limit: 6, random: false },
    icon: Link2,
  },
  {
    value: 'PROFILE',
    label: 'Profile',
    description: 'Show avatar, bio, and social links.',
    template: { avatar: '', name: '', bio: '', socials: [] },
    icon: UserRound,
  },
  {
    value: 'DATE_CARD',
    label: 'Date Card',
    description: 'Show date, time, and site running days.',
    template: { showTime: true, siteStartDate: '' },
    icon: CalendarDays,
  },
  {
    value: 'PHOTO_GALLERY',
    label: 'Photo Gallery',
    description: 'Show a group of images.',
    template: { images: [] },
    icon: Image,
  },
]

const typeLabels = Object.fromEntries(
  widgetTypes.map((item) => [item.value, item.label])
) as Record<WidgetType, string>

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

  const rows = [...(widgets.data ?? [])].sort(
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
      title='Widgets'
      description='Drag widgets to the left or right frontend column, then reorder them.'
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
              title='Left Widgets'
              widgets={leftWidgets}
              removingId={removeWidget.variables}
              updatingId={updateWidget.isPending ? updateWidget.variables?.id : undefined}
              isPaletteDragging={activeDrag?.kind === 'palette'}
              onRemove={(id) => removeWidget.mutate(id)}
              onUpdate={(id, payload) => updateWidget.mutate({ id, payload })}
            />
            <WidgetAreaColumn
              area='RIGHT'
              title='Right Widgets'
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
        <CardTitle>Component Library</CardTitle>
        <CardDescription>Drag a component into a column to create it.</CardDescription>
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
              Added
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
            <CardDescription>Drag cards to reorder or move them to another side.</CardDescription>
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
                Drop here
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
            {typeLabels[widget.type]} / {widget.enabled ? 'Enabled' : 'Disabled'}
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
          <span className='sr-only'>Delete</span>
        </Button>
      </div>
      {widget.type === 'MUSIC_PLAYER' ? (
        <MusicPlaylistEditor widget={widget} updating={updating} onUpdate={onUpdate} />
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
            {typeLabels[widget.type]} / {widget.enabled ? 'Enabled' : 'Disabled'}
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
      window.alert('Please enter a NetEase playlist URL.')
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
      window.alert(error instanceof Error ? error.message : 'Failed to load playlist.')
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
        <Label htmlFor={`netease-${widget.id}`}>NetEase playlist URL</Label>
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
            {fetching ? 'Loading' : 'Validate'}
          </Button>
        </div>
      </div>

      {playlistSource ? (
        <div className='rounded-md border bg-muted/30 p-3 text-sm'>
          <div className='font-medium'>{playlistSource.title || 'NetEase playlist'}</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            {playlistSource.trackCount
              ? `${playlistSource.trackCount} tracks`
              : 'Playlist source configured'}
          </div>
        </div>
      ) : null}

      <Button type='button' disabled={updating} onClick={savePlaylist}>
        {updating ? 'Saving' : 'Save playlist'}
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
