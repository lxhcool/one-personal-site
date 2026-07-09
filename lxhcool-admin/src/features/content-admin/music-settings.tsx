import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Music2 } from 'lucide-react'
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
import type { SiteWidget } from './types'

type PlaylistSource = {
  provider: 'netease'
  url: string
  id?: string
  title?: string
  cover?: string
  trackCount?: number
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

export function MusicSettingsPage() {
  const queryClient = useQueryClient()

  const widgets = useQuery({
    queryKey: ['admin-widgets'],
    queryFn: widgetsApi.list,
  })

  const musicWidget = widgets.data?.find(
    (w: SiteWidget) => w.type === 'MUSIC_PLAYER'
  ) ?? null

  const createWidget = useMutation({
    mutationFn: widgetsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-widgets'] }),
  })

  const updateWidget = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      widgetsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-widgets'] }),
  })

  const [playlistSource, setPlaylistSource] = useState<PlaylistSource | null>(null)
  const [neteaseUrl, setNeteaseUrl] = useState('')
  const [fetching, setFetching] = useState(false)

  // 当 widget 数据加载或更新后同步状态
  useEffect(() => {
    if (musicWidget) {
      const source = readPlaylistSource(musicWidget.config)
      setPlaylistSource(source)
      setNeteaseUrl(source?.url ?? '')
    }
  }, [musicWidget?.id, JSON.stringify(musicWidget?.config)])

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
    if (!musicWidget) return

    const url = neteaseUrl.trim()
    updateWidget.mutate({
      id: musicWidget.id,
      payload: {
        config: {
          ...musicWidget.config,
          playlistSource: playlistSource ?? (url ? { provider: 'netease', url } : null),
        },
      },
    })
  }

  function handleCreateWidget() {
    createWidget.mutate({
      area: 'LEFT',
      type: 'MUSIC_PLAYER',
      title: '音乐播放器',
      enabled: true,
      sortOrder: 0,
      config: { playlist: [], playlistSource: null },
    })
  }

  if (widgets.isError) throw widgets.error
  if (createWidget.isError) throw createWidget.error
  if (updateWidget.isError) throw updateWidget.error

  return (
    <PageShell
      title='音乐播放器'
      description='配置首页音乐播放器的网易云歌单。'
    >
      <div className='mx-auto max-w-2xl'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Music2 className='size-5' />
              歌单配置
            </CardTitle>
            <CardDescription>
              输入网易云歌单链接，校验后将作为音乐小工具的播放来源。
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4'>
            {widgets.isLoading ? (
              <div className='py-8 text-center text-sm text-muted-foreground'>
                加载中...
              </div>
            ) : !musicWidget ? (
              <div className='grid gap-4'>
                <div className='rounded-md border bg-muted/30 p-6 text-center'>
                  <Music2 className='mx-auto mb-3 size-10 text-muted-foreground' />
                  <div className='mb-2 font-medium'>尚未添加音乐播放器</div>
                  <div className='text-sm text-muted-foreground'>
                    点击下方按钮自动添加到前台页面。
                  </div>
                </div>
                <Button
                  onClick={handleCreateWidget}
                  disabled={createWidget.isPending}
                  className='w-full'
                >
                  {createWidget.isPending ? '添加中...' : '添加音乐播放器'}
                </Button>
              </div>
            ) : (
              <div className='grid gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='netease-url'>网易云歌单链接</Label>
                  <div className='flex gap-2'>
                    <Input
                      id='netease-url'
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
                  <div className='rounded-md border bg-muted/30 p-4 text-sm'>
                    <div className='font-medium'>
                      {playlistSource.title || '网易云歌单'}
                    </div>
                    <div className='mt-1 flex items-center gap-3 text-xs text-muted-foreground'>
                      {playlistSource.trackCount ? (
                        <span>{playlistSource.trackCount} 首歌曲</span>
                      ) : null}
                      {playlistSource.id ? (
                        <span>ID: {playlistSource.id}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <Button
                  type='button'
                  disabled={updateWidget.isPending}
                  onClick={savePlaylist}
                  className='w-full'
                >
                  {updateWidget.isPending ? '保存中...' : '保存歌单'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
