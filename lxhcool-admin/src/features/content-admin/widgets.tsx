import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CalendarDays,
  FolderTree,
  Images,
  Keyboard,
  Monitor,
  Move,
  Music2,
  Quote,
  RotateCcw,
  Save,
  Smartphone,
  Tablet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageShell } from './components/page-shell'
import { widgetsApi } from './api'
import { FRONTEND_PREVIEW_URL } from './env'
import type {
  SiteWidget,
  WidgetArea,
  WidgetType,
  WidgetVerticalPosition,
} from './types'

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
    value: 'DATE_CARD',
    label: '日期卡片',
    description: '展示日期、时间和站点运行信息。',
    template: { showTime: true, siteStartDate: '' },
    icon: CalendarDays,
  },
  {
    value: 'PHOTO_GALLERY',
    label: '照片墙',
    description: '展示后台照片墙中已经配置的图片。',
    template: { images: [] },
    icon: Images,
  },
  {
    value: 'PROJECT_TREE',
    label: '项目目录',
    description: '展示左上角的项目文件目录树。',
    template: { maxDepth: 3 },
    icon: FolderTree,
  },
  {
    value: 'KEYBOARD',
    label: '键盘',
    description: '展示桌面边缘的机械键盘组件。',
    template: {},
    icon: Keyboard,
  },
]

export function WidgetsPage() {
  const queryClient = useQueryClient()
  const widgets = useQuery({
    queryKey: ['admin-widgets'],
    queryFn: widgetsApi.list,
  })
  const createWidget = useMutation({
    mutationFn: widgetsApi.create,
    onSuccess: (created) => {
      queryClient.setQueryData<SiteWidget[]>(['admin-widgets'], (current = []) => [
        ...current.filter((widget) => widget.id !== created.id),
        created,
      ])
      queryClient.invalidateQueries({ queryKey: ['admin-widgets'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '小工具启用失败，请重试')
    },
  })
  const updateWidget = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      widgetsApi.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-widgets'] })
      const previous = queryClient.getQueryData<SiteWidget[]>(['admin-widgets'])
      queryClient.setQueryData<SiteWidget[]>(['admin-widgets'], (current) =>
        current?.map((widget) =>
          widget.id === id ? ({ ...widget, ...payload } as SiteWidget) : widget
        )
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin-widgets'], context.previous)
      }
      toast.error(_error instanceof Error ? _error.message : '小工具更新失败，请重试')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-widgets'] }),
  })
  const saveVisualLayout = useMutation({
    mutationFn: async (changes: Record<string, Record<string, unknown>>) => {
      await Promise.all(
        Object.entries(changes).map(([id, payload]) =>
          widgetsApi.update(id, payload)
        )
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-widgets'] }),
  })

  if (widgets.isError) throw widgets.error
  const rows = [...(widgets.data ?? [])]
    .filter((widget) => widget.type !== 'FRIEND_LINKS')
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.updatedAt.localeCompare(b.updatedAt)
    )

  return (
    <PageShell
      fluid
      fixed
      title='小工具'
      description='左侧控制是否显示，右侧在真实前台画布中调整位置。'
    >
      <div className='grid min-h-0 flex-1 items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)]'>
        <div className='min-h-0'>
          <WidgetVisibilityList
            widgets={rows}
            creatingType={
              createWidget.isPending
                ? (createWidget.variables?.type as WidgetType | undefined)
                : undefined
            }
            onToggle={(item, widget, enabled) => {
              if (widget) {
                updateWidget.mutate({ id: widget.id, payload: { enabled } })
                return
              }
              if (!enabled) return

              const placement = getDefaultWidgetPlacement(item.value)
              createWidget.mutate({
                ...placement,
                type: item.value,
                title: item.label,
                enabled: true,
                sortOrder: widgetTypes.findIndex((candidate) => candidate.value === item.value),
                config: item.template,
              })
            }}
            onRotationPreview={(widget, rotation) => {
              if (!widget) return
              queryClient.setQueryData<SiteWidget[]>(['admin-widgets'], (current) =>
                current?.map((candidate) =>
                  candidate.id === widget.id ? { ...candidate, rotation } : candidate
                )
              )
            }}
            onRotationCommit={(item, widget, rotation) => {
              if (widget) {
                updateWidget.mutate({ id: widget.id, payload: { rotation } })
                return
              }

              const placement = getDefaultWidgetPlacement(item.value)
              createWidget.mutate({
                ...placement,
                rotation,
                type: item.value,
                title: item.label,
                enabled: false,
                sortOrder: widgetTypes.findIndex((candidate) => candidate.value === item.value),
                config: item.template,
              })
            }}
          />
        </div>

        <div className='min-h-0 min-w-0'>
          <WidgetLayoutStudio
            widgets={rows}
            saving={saveVisualLayout.isPending}
            onSave={(changes) => saveVisualLayout.mutateAsync(changes)}
          />
        </div>
      </div>
    </PageShell>
  )
}

type WidgetDefinition = (typeof widgetTypes)[number]

function getDefaultWidgetPlacement(type: WidgetType) {
  const placements: Partial<Record<
    WidgetType,
    {
      area: WidgetArea
      verticalPosition: WidgetVerticalPosition
      horizontalOffset: number
      verticalOffset: number
      rotation: number
    }
  >> = {
    PROJECT_TREE: {
      area: 'LEFT',
      verticalPosition: 'TOP',
      horizontalOffset: 24,
      verticalOffset: 22,
      rotation: -3,
    },
    HITOKOTO: {
      area: 'RIGHT',
      verticalPosition: 'TOP',
      horizontalOffset: 20,
      verticalOffset: 82,
      rotation: 2,
    },
    DATE_CARD: {
      area: 'RIGHT',
      verticalPosition: 'TOP',
      horizontalOffset: 20,
      verticalOffset: 330,
      rotation: -2,
    },
    PHOTO_GALLERY: {
      area: 'RIGHT',
      verticalPosition: 'BOTTOM',
      horizontalOffset: 20,
      verticalOffset: 220,
      rotation: -2,
    },
    KEYBOARD: {
      area: 'LEFT',
      verticalPosition: 'BOTTOM',
      horizontalOffset: 24,
      verticalOffset: 16,
      rotation: 0,
    },
    MUSIC_PLAYER: {
      area: 'LEFT',
      verticalPosition: 'BOTTOM',
      horizontalOffset: 24,
      verticalOffset: 300,
      rotation: 0,
    },
  }
  const placement = placements[type]
  if (!placement) throw new Error(`Unsupported widget type: ${type}`)
  return placement
}

function WidgetVisibilityList({
  widgets,
  creatingType,
  onToggle,
  onRotationPreview,
  onRotationCommit,
}: {
  widgets: SiteWidget[]
  creatingType?: WidgetType
  onToggle: (
    item: WidgetDefinition,
    widget: SiteWidget | undefined,
    enabled: boolean
  ) => void
  onRotationPreview: (widget: SiteWidget | undefined, rotation: number) => void
  onRotationCommit: (
    item: WidgetDefinition,
    widget: SiteWidget | undefined,
    rotation: number
  ) => void
}) {
  const [rotationDrafts, setRotationDrafts] = useState<Partial<Record<WidgetType, number>>>({})

  return (
    <Card className='flex h-full min-h-0 flex-col overflow-hidden'>
      <CardHeader className='shrink-0 border-b'>
        <CardTitle className='text-base'>前台显示</CardTitle>
        <CardDescription>
          开关只控制是否显示，不会删除已经保存的配置和位置。
        </CardDescription>
      </CardHeader>
      <CardContent className='min-h-0 flex-1 overflow-y-auto p-0'>
        <div className='divide-y'>
          {widgetTypes.map((item) => {
            const widget = widgets.find((candidate) => candidate.type === item.value)
            const Icon = item.icon
            const rotation = rotationDrafts[item.value]
              ?? widget?.rotation
              ?? getDefaultWidgetPlacement(item.value).rotation

            return (
              <div
                key={item.value}
                className='px-4 py-3 transition-colors hover:bg-muted/30'
              >
                <div className='flex min-h-10 items-center gap-3'>
                  <div className='rounded-md border bg-background p-2 text-muted-foreground shadow-xs'>
                    <Icon className='size-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='font-medium'>{item.label}</span>
                      <Badge variant='secondary' className='h-5 text-[10px]'>
                        {!widget ? '未启用' : widget.enabled ? '显示中' : '已隐藏'}
                      </Badge>
                    </div>
                    <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    checked={widget?.enabled ?? creatingType === item.value}
                    aria-label={`${item.label}前台显示`}
                    onCheckedChange={(enabled) => onToggle(item, widget, enabled)}
                  />
                </div>

                <div className='mt-3 grid grid-cols-[32px_minmax(0,1fr)_38px] items-center gap-2'>
                  <span className='text-xs text-muted-foreground'>旋转</span>
                  <input
                    type='range'
                    min={-45}
                    max={45}
                    step={1}
                    value={rotation}
                    aria-label={`${item.label}旋转角度`}
                    className='h-5 w-full cursor-pointer accent-primary'
                    onChange={(event) => {
                      const nextRotation = Number(event.currentTarget.value)
                      setRotationDrafts((current) => ({
                        ...current,
                        [item.value]: nextRotation,
                      }))
                      onRotationPreview(widget, nextRotation)
                    }}
                    onPointerUp={(event) => {
                      onRotationCommit(item, widget, Number(event.currentTarget.value))
                    }}
                    onKeyUp={(event) => {
                      if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
                        onRotationCommit(item, widget, Number(event.currentTarget.value))
                      }
                    }}
                  />
                  <output className='text-right font-mono text-xs tabular-nums text-muted-foreground'>
                    {rotation}°
                  </output>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

const previewPresets = [
  { width: 1440, height: 900, label: '桌面', icon: Monitor },
  { width: 1024, height: 768, label: '紧凑', icon: Tablet },
  { width: 767, height: 900, label: '移动端', icon: Smartphone },
] as const

function getCurrentBrowserViewport() {
  if (typeof window === 'undefined') return { width: 1440, height: 900 }
  return {
    width: Math.max(320, Math.round(window.innerWidth)),
    height: Math.max(480, Math.round(window.innerHeight)),
  }
}

function WidgetLayoutStudio({
  widgets,
  saving,
  onSave,
}: {
  widgets: SiteWidget[]
  saving: boolean
  onSave: (changes: Record<string, Record<string, unknown>>) => Promise<void>
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const widgetsRef = useRef(widgets)
  const onSaveRef = useRef(onSave)
  const [currentViewport, setCurrentViewport] = useState(getCurrentBrowserViewport)
  const [previewSize, setPreviewSize] = useState(getCurrentBrowserViewport)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [frameReady, setFrameReady] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>({})
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  widgetsRef.current = widgets
  onSaveRef.current = onSave

  const previewUrl = useMemo(() => {
    const url = new URL(FRONTEND_PREVIEW_URL)
    url.searchParams.set('widgetEditor', '1')
    return url.toString()
  }, [])
  const previewOrigin = useMemo(
    () => new URL(FRONTEND_PREVIEW_URL).origin,
    []
  )
  const canvasScale = stageSize.width > 0 && stageSize.height > 0
    ? Math.min(
        1,
        Math.max(
          0.16,
          Math.min(
            (stageSize.width - 24) / previewSize.width,
            (stageSize.height - 24) / previewSize.height
          )
        )
      )
    : 0.65
  const widgetSignature = widgets
    .map((widget) => [
      widget.id,
      widget.enabled,
      widget.area,
      widget.verticalPosition,
      widget.horizontalOffset,
      widget.verticalOffset,
      widget.rotation,
      widget.updatedAt,
    ].join(':'))
    .join('|')
  const draftCount = Object.keys(drafts).length

  function syncWidgets() {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'widget-editor-sync', widgets: widgetsRef.current },
      previewOrigin
    )
  }

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const observer = new ResizeObserver(([entry]) => {
      setStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(stage)
    const rect = stage.getBoundingClientRect()
    setStageSize({ width: rect.width, height: rect.height })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        event.origin !== previewOrigin
      ) return
      const message = event.data as {
        type?: string
        id?: unknown
        payload?: unknown
      } | null

      if (message?.type === 'widget-editor-ready') {
        setFrameReady(true)
        syncWidgets()
        return
      }

      if (
        message?.type === 'widget-editor-change' &&
        typeof message.id === 'string' &&
        message.payload &&
        typeof message.payload === 'object'
      ) {
        setDrafts((current) => ({
          ...current,
          [message.id as string]: {
            ...(current[message.id as string] ?? {}),
            ...(message.payload as Record<string, unknown>),
          },
        }))
        setSaveState('idle')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (frameReady) syncWidgets()
  }, [frameReady, widgetSignature])

  async function saveDrafts() {
    if (!draftCount || saving) return
    try {
      await onSaveRef.current(drafts)
      setDrafts({})
      setSaveState('saved')
      toast.success('布局已保存')
    } catch (error) {
      setSaveState('error')
      toast.error(error instanceof Error ? error.message : '布局保存失败，请重试')
    }
  }

  function resetDrafts() {
    setDrafts({})
    setSaveState('idle')
    syncWidgets()
  }

  function useCurrentViewport() {
    const nextViewport = getCurrentBrowserViewport()
    setCurrentViewport(nextViewport)
    setPreviewSize(nextViewport)
  }

  return (
    <Card className='flex h-full min-h-0 flex-col overflow-hidden border-primary/15 bg-card/95 shadow-sm'>
      <CardHeader className='shrink-0 border-b bg-muted/20 py-4'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex items-start gap-3'>
            <div className='rounded-md border bg-background p-2 text-primary shadow-xs'>
              <Move className='size-4' />
            </div>
            <div>
              <CardTitle className='text-base'>前台布局工作台</CardTitle>
              <CardDescription className='mt-1'>
                绿色轮廓可以拖动，红色区域始终留给中间内容。
              </CardDescription>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex rounded-md border bg-background p-1 shadow-xs'>
              <Button
                type='button'
                size='sm'
                variant={
                  previewSize.width === currentViewport.width &&
                  previewSize.height === currentViewport.height
                    ? 'secondary'
                    : 'ghost'
                }
                className='h-8 gap-1.5 px-2.5'
                onClick={useCurrentViewport}
              >
                <Monitor className='size-3.5' />
                当前窗口
                <span className='font-mono text-[10px] text-muted-foreground'>
                  {currentViewport.width}×{currentViewport.height}
                </span>
              </Button>
              {previewPresets.map((preset) => {
                const Icon = preset.icon
                const active =
                  previewSize.width === preset.width &&
                  previewSize.height === preset.height
                return (
                  <Button
                    key={`${preset.width}x${preset.height}`}
                    type='button'
                    size='sm'
                    variant={active ? 'secondary' : 'ghost'}
                    className='h-8 gap-1.5 px-2.5'
                    onClick={() => setPreviewSize({
                      width: preset.width,
                      height: preset.height,
                    })}
                  >
                    <Icon className='size-3.5' />
                    {preset.label}
                    <span className='font-mono text-[10px] text-muted-foreground'>
                      {preset.width}×{preset.height}
                    </span>
                  </Button>
                )
              })}
            </div>
            <Badge
              variant={saving || draftCount ? 'default' : 'secondary'}
              className={saveState === 'error' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {saving
                ? '正在保存…'
                : draftCount
                  ? `${draftCount} 项未保存`
                  : saveState === 'saved'
                    ? '已保存'
                    : saveState === 'error'
                      ? '保存失败'
                      : frameReady
                        ? '布局已同步'
                        : '正在连接…'}
            </Badge>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='h-9 gap-1.5'
              disabled={!draftCount || saving}
              onClick={resetDrafts}
            >
              <RotateCcw className='size-3.5' />
              放弃更改
            </Button>
            <Button
              type='button'
              size='sm'
              className='h-9 gap-1.5'
              disabled={!draftCount || saving}
              onClick={() => void saveDrafts()}
            >
              <Save className='size-3.5' />
              保存布局{draftCount ? ` (${draftCount})` : ''}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex min-h-0 flex-1 flex-col p-0'>
        <div
          ref={stageRef}
          className='relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_center,hsl(var(--muted-foreground)/0.16)_1px,transparent_1px)] bg-[length:18px_18px] p-3'
        >
          <div
            className='mx-auto overflow-hidden rounded-lg border bg-background shadow-[0_18px_60px_hsl(var(--foreground)/0.12)]'
            style={{
              width: previewSize.width * canvasScale,
              height: previewSize.height * canvasScale,
            }}
          >
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title='前台小工具布局预览'
              className='block border-0 bg-background'
              style={{
                width: previewSize.width,
                height: previewSize.height,
                transform: `scale(${canvasScale})`,
                transformOrigin: 'top left',
              }}
              onLoad={() => {
                setFrameReady(true)
                window.setTimeout(syncWidgets, 120)
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
