import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { FileAudio, FileVideo, ImagePlus, Images, Music2, Save, Type, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageShell } from './components/page-shell'
import { MarkdownEditor } from './components/markdown-editor'
import {
  optionalString,
  categoriesApi,
  postsApi,
  resolveAssetUrl,
  toStringList,
  uploadsApi,
  musicApi,
} from './api'
import type { PostType, PublishStatus } from './types'

type MediaConfig = Record<string, unknown>
type MomentKind = 'TEXT' | 'PHOTO' | 'MUSIC' | 'VIDEO'
const maxMomentPhotos = 9
const maxImageSize = 5 * 1024 * 1024

export function PostFormPage({
  postId,
  initialType = 'ARTICLE',
}: {
  postId?: string
  initialType?: PostType
}) {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<PostType>(initialType)
  const [momentKind, setMomentKind] = useState<MomentKind>('TEXT')
  const [coverImage, setCoverImage] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [audioUrl, setAudioUrl] = useState('')
  const [musicTitle, setMusicTitle] = useState('')
  const [musicArtist, setMusicArtist] = useState('')
  const [musicCover, setMusicCover] = useState('')
  const [musicLink, setMusicLink] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const [isFetchingMusic, setIsFetchingMusic] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const post = useQuery({
    queryKey: ['admin-post', postId],
    queryFn: () => postsApi.get(postId!),
    enabled: Boolean(postId),
  })
  const postCategories = useQuery({
    queryKey: ['admin-categories', 'POST'],
    queryFn: () => categoriesApi.list('POST'),
  })
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      postId ? postsApi.update(postId, payload) : postsApi.create(payload),
    onSuccess: (_data, variables) =>
      navigate({ to: variables.type === 'MOMENT' ? '/moments' : '/posts' }),
  })

  useEffect(() => {
    if (post.isError) throw post.error
    if (postCategories.isError) throw postCategories.error
    if (mutation.isError) throw mutation.error
  }, [
    mutation.error,
    mutation.isError,
    post.error,
    post.isError,
    postCategories.error,
    postCategories.isError,
  ])

  useEffect(() => {
    if (!post.data) return
    const media = post.data.media ?? {}
    const music = getMediaObject(media, 'music')
    const video = getMediaObject(media, 'video')
    setContent(post.data.content)
    setPostType(post.data.type ?? 'ARTICLE')
    setMomentKind(getMomentKind(media))
    setCoverImage(post.data.coverImage ?? '')
    setPhotos(getMediaStringArray(media, 'photos'))
    setAudioUrl(getMediaString(music, 'audioUrl'))
    setMusicTitle(getMediaString(music, 'title'))
    setMusicArtist(getMediaString(music, 'artist'))
    setMusicCover(getMediaString(music, 'cover') || getMediaString(music, 'coverUrl'))
    setMusicLink(getMediaString(music, 'externalUrl'))
    setVideoUrl(getMediaString(video, 'videoUrl'))
  }, [post.data])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const type = String(formData.get('type') ?? 'ARTICLE') as PostType
    const title = String(formData.get('title') ?? '').trim()
    const status = String(formData.get('status') ?? 'PUBLISHED') as PublishStatus

    mutation.mutate({
      type,
      title,
      slug: post.data?.slug ?? createSlug(title),
      category: type === 'ARTICLE' ? optionalString(formData.get('category')) : undefined,
      excerpt: type === 'ARTICLE' ? optionalString(formData.get('excerpt')) : undefined,
      content: type === 'ARTICLE' ? content : title,
      media:
        type === 'MOMENT'
          ? buildMomentMedia(momentKind, formData, photos, audioUrl, videoUrl, {
              title: musicTitle,
              artist: musicArtist,
              cover: musicCover,
              externalUrl: musicLink,
            })
          : {},
      coverImage: type === 'ARTICLE' && coverImage ? coverImage : undefined,
      status,
      seoTitle: type === 'ARTICLE' ? optionalString(formData.get('seoTitle')) : undefined,
      seoDescription:
        type === 'ARTICLE' ? optionalString(formData.get('seoDescription')) : undefined,
      tags: type === 'ARTICLE' ? toStringList(formData.get('tags')) : [],
    })
  }

  async function uploadCover(file: File) {
    setIsUploadingCover(true)
    try {
      const image = await uploadsApi.image(file)
      setCoverImage(image.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '封面上传失败')
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  async function uploadPhotos(files: File[]) {
    if (photos.length >= maxMomentPhotos) {
      toast.error(`照片最多上传 ${maxMomentPhotos} 张`)
      if (photoInputRef.current) photoInputRef.current.value = ''
      return
    }

    const remainingSlots = maxMomentPhotos - photos.length
    const selectedFiles = files
      .filter((file) => {
        if (file.size <= maxImageSize) return true
        toast.error(`${file.name} 超过 5MB，已跳过`)
        return false
      })
      .slice(0, remainingSlots)

    if (files.length > remainingSlots) {
      toast.warning(`照片最多上传 ${maxMomentPhotos} 张，已自动保留前 ${selectedFiles.length} 张`)
    }

    if (selectedFiles.length === 0) {
      if (photoInputRef.current) photoInputRef.current.value = ''
      return
    }

    setIsUploadingPhoto(true)
    try {
      const uploadedImages: { url: string }[] = []
      for (const file of selectedFiles) {
        const image = await uploadsApi.image(file)
        uploadedImages.push(image)
      }
      setPhotos((current) => {
        const next = [
          ...current,
          ...uploadedImages.map((image) => image.url),
        ]
        return next.slice(0, maxMomentPhotos)
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '照片上传失败')
    } finally {
      setIsUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function uploadAudio(file: File) {
    setIsUploadingAudio(true)
    try {
      const audio = await uploadsApi.audio(file)
      setAudioUrl(audio.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '音频上传失败')
    } finally {
      setIsUploadingAudio(false)
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }

  async function fetchNeteaseMusicMetadata() {
    const url = musicLink.trim()
    if (!url) {
      toast.error('请先填写网易云音乐链接')
      return
    }

    setIsFetchingMusic(true)
    try {
      const metadata = await musicApi.neteaseMetadata(url)
      setMusicTitle(metadata.title)
      setMusicArtist(metadata.artist)
      setMusicCover(metadata.cover)
      toast.success('音乐信息已获取')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '获取音乐信息失败')
    } finally {
      setIsFetchingMusic(false)
    }
  }

  async function uploadVideo(file: File) {
    setIsUploadingVideo(true)
    try {
      const video = await uploadsApi.video(file)
      setVideoUrl(video.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '视频上传失败')
    } finally {
      setIsUploadingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const value = post.data
  const media = (value?.media ?? {}) as MediaConfig
  const video = getMediaObject(media, 'video')

  return (
    <PageShell
      title={postId ? '编辑内容' : '新建内容'}
      description='普通文章和动态分开发布；动态只填写一个标题，并选择一种附件类型。'
    >
      <form
        key={value?.id ?? 'new-post'}
        onSubmit={onSubmit}
        className='grid gap-6 lg:grid-cols-[1fr_320px]'
      >
        <Card>
          <CardHeader>
            <CardTitle>{postType === 'ARTICLE' ? '文章内容' : '动态内容'}</CardTitle>
            <CardDescription>
              {postType === 'ARTICLE'
                ? '适合长文章和 Markdown 正文。'
                : '动态不会进入详情页，只在首页信息流展示。'}
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <Field
              name='title'
              label={postType === 'ARTICLE' ? '标题' : '动态标题'}
              defaultValue={value?.title}
              required
              placeholder={postType === 'MOMENT' ? '这一条动态想说什么' : undefined}
            />

            {postType === 'ARTICLE' ? (
              <>
                <Field
                  name='category'
                  label='分类'
                  defaultValue={value?.category}
                  list='post-category-options'
                />
                <datalist id='post-category-options'>
                  {(postCategories.data ?? []).map((category) => (
                    <option key={category.id} value={category.name} />
                  ))}
                </datalist>
                <Field name='excerpt' label='摘要' defaultValue={value?.excerpt} />
                <div className='grid gap-2'>
                  <Label>正文</Label>
                  <MarkdownEditor value={content} onChange={setContent} />
                </div>
              </>
            ) : (
              <div className='grid gap-2'>
                <Label>动态类型</Label>
                <div className='grid grid-cols-2 gap-2'>
                  <MomentKindButton
                    active={momentKind === 'TEXT'}
                    icon={Type}
                    label='文字'
                    onClick={() => setMomentKind('TEXT')}
                  />
                  <MomentKindButton
                    active={momentKind === 'PHOTO'}
                    icon={Images}
                    label='照片'
                    onClick={() => setMomentKind('PHOTO')}
                  />
                  <MomentKindButton
                    active={momentKind === 'MUSIC'}
                    icon={Music2}
                    label='音乐'
                    onClick={() => setMomentKind('MUSIC')}
                  />
                  <MomentKindButton
                    active={momentKind === 'VIDEO'}
                    icon={FileVideo}
                    label='视频'
                    onClick={() => setMomentKind('VIDEO')}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className='grid content-start gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <div className='grid gap-2'>
                <Label>内容类型</Label>
                <Select
                  name='type'
                  value={postType}
                  onValueChange={(nextType) => setPostType(nextType as PostType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='MOMENT'>动态</SelectItem>
                    <SelectItem value='ARTICLE'>文章</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {postType === 'ARTICLE' ? (
                <Field name='tags' label='标签' defaultValue={value?.tags.join(', ')} />
              ) : null}
              <Button disabled={mutation.isPending}>
                <Save />
                保存
              </Button>
            </CardContent>
          </Card>

          {postType === 'MOMENT' && momentKind === 'PHOTO' ? (
            <Card>
              <CardHeader>
                <CardTitle>照片</CardTitle>
                <CardDescription>当前动态只会保存照片附件。</CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4'>
                {photos.length > 0 ? (
                  <div className='grid grid-cols-3 gap-2'>
                    {photos.map((photo) => (
                      <div key={photo} className='group relative'>
                        <img
                          src={resolveAssetUrl(photo)}
                          alt=''
                          className='aspect-square w-full rounded-md border object-cover'
                        />
                        <Button
                          type='button'
                          variant='secondary'
                          size='icon'
                          className='absolute right-1 top-1 size-7 opacity-0 transition-opacity group-hover:opacity-100'
                          onClick={() =>
                            setPhotos((current) => current.filter((item) => item !== photo))
                          }
                        >
                          <X className='size-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <input
                  ref={photoInputRef}
                  type='file'
                  multiple
                  accept='image/jpeg,image/png,image/webp,image/gif'
                  className='hidden'
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files ?? [])
                    if (files.length > 0) void uploadPhotos(files)
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  disabled={isUploadingPhoto || photos.length >= maxMomentPhotos}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus />
                  {photos.length >= maxMomentPhotos ? '已达 9 张上限' : '上传照片'}
                </Button>
                <p className='text-xs text-muted-foreground'>
                  已上传 {photos.length}/{maxMomentPhotos} 张，单张不超过 5MB
                </p>
              </CardContent>
            </Card>
          ) : null}

          {postType === 'MOMENT' && momentKind === 'MUSIC' ? (
            <Card>
              <CardHeader>
                <CardTitle>??</CardTitle>
                <CardDescription>????????????????</CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='musicTitle'>???</Label>
                  <Input
                    id='musicTitle'
                    name='musicTitle'
                    value={musicTitle}
                    onChange={(event) => setMusicTitle(event.currentTarget.value)}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='musicArtist'>??</Label>
                  <Input
                    id='musicArtist'
                    name='musicArtist'
                    value={musicArtist}
                    onChange={(event) => setMusicArtist(event.currentTarget.value)}
                  />
                </div>
                {musicCover ? (
                  <img
                    src={resolveAssetUrl(musicCover)}
                    alt=''
                    className='aspect-square w-24 rounded-md border object-cover'
                  />
                ) : null}
                {audioUrl ? <audio src={resolveAssetUrl(audioUrl)} controls className='w-full' /> : null}
                <input
                  ref={audioInputRef}
                  type='file'
                  accept='audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm'
                  className='hidden'
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (file) void uploadAudio(file)
                  }}
                />
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={isUploadingAudio}
                    onClick={() => audioInputRef.current?.click()}
                  >
                    <FileAudio />
                    {audioUrl ? '????' : '????'}
                  </Button>
                  {audioUrl ? (
                    <Button type='button' variant='ghost' onClick={() => setAudioUrl('')}>
                      ??
                    </Button>
                  ) : null}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='musicLink'>???????</Label>
                  <Input
                    id='musicLink'
                    name='musicLink'
                    value={musicLink}
                    onChange={(event) => setMusicLink(event.currentTarget.value)}
                    placeholder='https://music.163.com/#/song?id=...'
                  />
                </div>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isFetchingMusic || !musicLink.trim()}
                  onClick={() => void fetchNeteaseMusicMetadata()}
                >
                  {isFetchingMusic ? '???...' : '??????'}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {postType === 'MOMENT' && momentKind === 'VIDEO' ? (
            <Card>
              <CardHeader>
                <CardTitle>视频</CardTitle>
                <CardDescription>上传视频，或粘贴 Bilibili 视频链接。</CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4'>
                <Field name='videoTitle' label='视频标题' defaultValue={getMediaString(video, 'title')} />
                {videoUrl ? (
                  <video
                    src={resolveAssetUrl(videoUrl)}
                    controls
                    className='aspect-video w-full rounded-md border bg-black'
                  />
                ) : null}
                <input
                  ref={videoInputRef}
                  type='file'
                  accept='video/mp4,video/webm,video/ogg'
                  className='hidden'
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (file) void uploadVideo(file)
                  }}
                />
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={isUploadingVideo}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <FileVideo />
                    {videoUrl ? '更换视频' : '上传视频'}
                  </Button>
                  {videoUrl ? (
                    <Button type='button' variant='ghost' onClick={() => setVideoUrl('')}>
                      移除
                    </Button>
                  ) : null}
                </div>
                <Field
                  name='videoLink'
                  label='Bilibili 视频链接'
                  defaultValue={getMediaString(video, 'externalUrl')}
                  placeholder='https://www.bilibili.com/video/BV...'
                />
              </CardContent>
            </Card>
          ) : null}

          {postType === 'ARTICLE' ? (
            <Card>
              <CardHeader>
                <CardTitle>媒体与 SEO</CardTitle>
              </CardHeader>
              <CardContent className='grid gap-4'>
                <div className='grid gap-2'>
                  <Label>封面图</Label>
                  {coverImage ? (
                    <img
                      src={resolveAssetUrl(coverImage)}
                      alt=''
                      className='aspect-video w-full rounded-md border object-cover'
                    />
                  ) : null}
                  <input
                    ref={coverInputRef}
                    type='file'
                    accept='image/jpeg,image/png,image/webp,image/gif'
                    className='hidden'
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0]
                      if (file) void uploadCover(file)
                    }}
                  />
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={isUploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      <ImagePlus />
                      {coverImage ? '更换图片' : '上传图片'}
                    </Button>
                    {coverImage ? (
                      <Button type='button' variant='ghost' onClick={() => setCoverImage('')}>
                        移除
                      </Button>
                    ) : null}
                  </div>
                </div>
                <Field name='seoTitle' label='SEO 标题' defaultValue={value?.seoTitle} />
                <Field
                  name='seoDescription'
                  label='SEO 描述'
                  defaultValue={value?.seoDescription}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </form>
    </PageShell>
  )
}

function MomentKindButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type='button'
      variant={active ? 'default' : 'outline'}
      className='h-20 flex-col gap-2'
      onClick={onClick}
    >
      <Icon className='size-5' />
      {label}
    </Button>
  )
}

function Field({
  name,
  label,
  defaultValue,
  required,
  list,
  placeholder,
}: {
  name: string
  label: string
  defaultValue?: string | null
  required?: boolean
  list?: string
  placeholder?: string
}) {
  return (
    <div className='grid gap-2'>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        list={list}
        placeholder={placeholder}
      />
    </div>
  )
}

function buildMomentMedia(
  kind: MomentKind,
  formData: FormData,
  photos: string[],
  audioUrl: string,
  videoUrl: string,
  musicMeta?: {
    title?: string
    artist?: string
    cover?: string
    externalUrl?: string
  }
) {
  if (kind === 'PHOTO') {
    return cleanObject({ kind, photos })
  }

  if (kind === 'MUSIC') {
    const musicExternalUrl = optionalString(formData.get('musicLink')) ?? musicMeta?.externalUrl
    return cleanObject({
      kind,
      music: cleanObject({
        source: audioUrl ? 'upload' : musicExternalUrl ? 'netease' : undefined,
        title: optionalString(formData.get('musicTitle')) ?? musicMeta?.title,
        artist: optionalString(formData.get('musicArtist')) ?? musicMeta?.artist,
        cover: musicMeta?.cover,
        audioUrl: audioUrl || undefined,
        externalUrl: musicExternalUrl,
        embedUrl: musicExternalUrl ? createNeteaseEmbedUrl(musicExternalUrl) : undefined,
      }),
    })
  }

  if (kind === 'VIDEO') {
    const videoExternalUrl = optionalString(formData.get('videoLink'))
    return cleanObject({
      kind,
      video: cleanObject({
        source: videoUrl ? 'upload' : videoExternalUrl ? 'bilibili' : undefined,
        title: optionalString(formData.get('videoTitle')),
        videoUrl: videoUrl || undefined,
        externalUrl: videoExternalUrl,
        embedUrl: videoExternalUrl ? createBilibiliEmbedUrl(videoExternalUrl) : undefined,
      }),
    })
  }

  return { kind }
}

function createNeteaseEmbedUrl(url: string) {
  const id = url.match(/[?&#]id=(\d+)/)?.[1]
  if (!id) return undefined
  return `https://music.163.com/outchain/player?type=2&id=${id}&auto=0&height=66`
}

function createBilibiliEmbedUrl(url: string) {
  const iframeSrc = url.match(/src=["']([^"']*player\.bilibili\.com[^"']+)["']/i)?.[1]
  if (iframeSrc) return disableVideoAutoplay(iframeSrc.startsWith('//') ? `https:${iframeSrc}` : iframeSrc)

  const bvid =
    url.match(/\/video\/(BV[a-zA-Z0-9]+)/i)?.[1] ??
    url.match(/\b(BV[a-zA-Z0-9]+)\b/i)?.[1]
  if (!bvid) return undefined

  const page = url.match(/[?&]p=(\d+)/)?.[1] ?? '1'
  return disableVideoAutoplay(
    `https://player.bilibili.com/player.html?isOutside=true&bvid=${bvid}&p=${page}`
  )
}

function disableVideoAutoplay(url: string) {
  try {
    const nextUrl = new URL(url)
    nextUrl.searchParams.set('autoplay', '0')
    return nextUrl.toString()
  } catch {
    return url.includes('?') ? `${url}&autoplay=0` : `${url}?autoplay=0`
  }
}

function getMediaObject(media: MediaConfig, key: string) {
  const value = media[key]
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as MediaConfig)
    : {}
}

function getMediaString(media: MediaConfig, key: string) {
  const value = media[key]
  return typeof value === 'string' ? value : ''
}

function getMediaStringArray(media: MediaConfig, key: string) {
  const value = media[key]
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function getMomentKind(media: MediaConfig): MomentKind {
  const kind = media.kind
  if (kind === 'PHOTO' || kind === 'MUSIC' || kind === 'VIDEO' || kind === 'TEXT') {
    return kind
  }
  if (getMediaStringArray(media, 'photos').length > 0) return 'PHOTO'
  if (Object.keys(getMediaObject(media, 'music')).length > 0 || getMediaString(media, 'embedUrl')) {
    return 'MUSIC'
  }
  if (Object.keys(getMediaObject(media, 'video')).length > 0) return 'VIDEO'
  return 'TEXT'
}

function cleanObject(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === '') return false
      if (Array.isArray(item)) return item.length > 0
      if (item && typeof item === 'object') return Object.keys(item).length > 0
      return true
    })
  )
}

function createSlug(title: string) {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `post-${Date.now()}`
}
