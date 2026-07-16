import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Images, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { uploadsApi, widgetsApi } from './api'
import type { SiteWidget } from './types'

type GalleryImage = {
  url: string
  alt: string
  caption: string
  slot: number
}

export function GallerySettingsPage() {
  const queryClient = useQueryClient()
  const widgets = useQuery({
    queryKey: ['admin-widgets'],
    queryFn: widgetsApi.list,
  })
  const galleryWidget =
    widgets.data?.find((widget: SiteWidget) => widget.type === 'PHOTO_GALLERY') ?? null

  const createWidget = useMutation({
    mutationFn: widgetsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-widgets'] })
      toast.success('照片墙已添加')
    },
  })
  const updateWidget = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      widgetsApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-widgets'] })
      toast.success('相册已保存')
    },
  })

  const [title, setTitle] = useState('相册')
  const [enabled, setEnabled] = useState(true)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [uploading, setUploading] = useState(false)
  const draggedSlot = useRef<number | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)

  useEffect(() => {
    if (!galleryWidget) return
    setTitle(galleryWidget.title || '相册')
    setEnabled(galleryWidget.enabled)
    setImages(normalizeGalleryImages(galleryWidget.config.images))
  }, [galleryWidget?.id, JSON.stringify(galleryWidget?.config), galleryWidget?.title, galleryWidget?.enabled])

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return
    const available = Math.max(0, 49 - images.length)
    if (available === 0) {
      toast.error('相册最多展示 49 张照片')
      return
    }

    setUploading(true)
    try {
      const uploaded: GalleryImage[] = []
      const usedSlots = new Set(images.map((image) => image.slot))
      for (const file of Array.from(files).slice(0, available)) {
        const optimizedFile = await optimizeGalleryImage(file)
        const image = await uploadsApi.image(optimizedFile)
        const slot = Array.from({ length: 49 }, (_, index) => index).find(
          (index) => !usedSlots.has(index)
        )
        if (slot === undefined) break
        usedSlots.add(slot)
        uploaded.push({ url: image.url, alt: '', caption: '', slot })
      }
      setImages((current) => [...current, ...uploaded].slice(0, 49))
      toast.success(`已上传 ${uploaded.length} 张照片`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '照片上传失败')
    } finally {
      setUploading(false)
    }
  }

  function updateImage(index: number, patch: Partial<GalleryImage>) {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...patch } : image
      )
    )
  }

  function moveImageToSlot(index: number, slot: number) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= 49) return
    setImages((current) => {
      const next = [...current]
      const occupiedIndex = next.findIndex(
        (image, imageIndex) => imageIndex !== index && image.slot === slot
      )
      const previousSlot = next[index].slot
      next[index] = { ...next[index], slot }
      if (occupiedIndex >= 0) {
        next[occupiedIndex] = { ...next[occupiedIndex], slot: previousSlot }
      }
      return next
    })
  }

  function handleGridDragStart(event: React.DragEvent<HTMLDivElement>, slot: number) {
    draggedSlot.current = slot
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(slot))
  }

  function handleGridDrop(event: React.DragEvent<HTMLDivElement>, targetSlot: number) {
    event.preventDefault()
    const sourceSlot = draggedSlot.current
    draggedSlot.current = null
    setDragOverSlot(null)
    if (!Number.isInteger(sourceSlot) || !Number.isInteger(targetSlot) || sourceSlot === targetSlot) {
      return
    }
    const imageIndex = images.findIndex((image) => image.slot === sourceSlot)
    if (imageIndex >= 0) moveImageToSlot(imageIndex, targetSlot)
  }

  function saveGallery() {
    if (!galleryWidget) return
    updateWidget.mutate({
      id: galleryWidget.id,
      payload: {
        title: title.trim() || '相册',
        enabled,
        area: 'RIGHT',
        config: {
          ...galleryWidget.config,
          images: images.map((image) => ({
            url: image.url,
            alt: image.alt.trim(),
            caption: image.caption.trim(),
            slot: image.slot,
          })),
        },
      },
    })
  }

  function createGallery() {
    createWidget.mutate({
      area: 'RIGHT',
      type: 'PHOTO_GALLERY',
      title: '相册',
      enabled: true,
      sortOrder: 0,
      config: { images: [] },
    })
  }

  if (widgets.isError) throw widgets.error
  if (createWidget.isError) throw createWidget.error
  if (updateWidget.isError) throw updateWidget.error

  return (
    <PageShell title='照片墙' description='管理前台右侧的平面相册和格子位置。'>
      {widgets.isLoading ? (
        <div className='py-16 text-center text-sm text-muted-foreground'>加载中...</div>
      ) : !galleryWidget ? (
        <div className='mx-auto max-w-xl'>
          <Card>
            <CardHeader className='text-center'>
              <Images className='mx-auto size-10 text-muted-foreground' />
              <CardTitle>尚未添加照片墙</CardTitle>
              <CardDescription>创建后会固定显示在前台右下方，不占用正文布局。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' disabled={createWidget.isPending} onClick={createGallery}>
                <ImagePlus />
                {createWidget.isPending ? '添加中...' : '添加照片墙'}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className='grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]'>
          <Card>
            <CardHeader>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <CardTitle>相册内容</CardTitle>
                  <CardDescription>最多 49 张，每张照片可放到 7 × 7 墙面的任意格子。</CardDescription>
                </div>
                <Badge variant='secondary'>{images.length} / 49</Badge>
              </div>
            </CardHeader>
            <CardContent className='grid gap-5'>
              <div className='grid gap-2'>
                <Label htmlFor='gallery-title'>标题</Label>
                <Input id='gallery-title' value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
              </div>

              <div className='flex items-center gap-3'>
                <Checkbox id='gallery-enabled' checked={enabled} onCheckedChange={(value) => setEnabled(value === true)} />
                <Label htmlFor='gallery-enabled'>在前台显示</Label>
              </div>

              <Label
                htmlFor='gallery-upload'
                className={`flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 text-sm transition-colors hover:border-primary/60 hover:bg-primary/5 ${
                  uploading || images.length >= 49 ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <ImagePlus className='size-4' />
                {uploading ? '上传中' : images.length >= 49 ? '已达到 49 张' : '选择照片'}
              </Label>
              <Input
                id='gallery-upload'
                className='sr-only'
                type='file'
                accept='image/jpeg,image/png,image/webp,image/gif'
                multiple
                disabled={uploading || images.length >= 49}
                onChange={(event) => {
                  void uploadImages(event.currentTarget.files)
                  event.currentTarget.value = ''
                }}
              />

              <div className='grid max-h-[560px] gap-3 overflow-y-auto pr-2'>
                {images.map((image, index) => (
                  <div key={`${image.url}-${index}`} className='grid grid-cols-[76px_minmax(0,1fr)_auto] gap-3 border-b pb-3 last:border-b-0 last:pb-0 [contain-intrinsic-size:104px] [content-visibility:auto]'>
                    <img src={image.url} alt='' loading='lazy' decoding='async' className='aspect-square w-[76px] rounded-md object-cover shadow-sm' />
                    <div className='grid min-w-0 content-center gap-2'>
                      <div className='text-xs text-muted-foreground'>格子 {image.slot + 1}</div>
                      <Input
                        value={image.alt}
                        onChange={(event) => updateImage(index, { alt: event.currentTarget.value })}
                        placeholder='图片替代文字'
                        aria-label={`第 ${index + 1} 张图片替代文字`}
                      />
                      <Input
                        value={image.caption}
                        onChange={(event) => updateImage(index, { caption: event.currentTarget.value })}
                        placeholder='照片说明（可选）'
                        aria-label={`第 ${index + 1} 张照片说明`}
                      />
                    </div>
                    <div className='grid content-center gap-1'>
                      <Button type='button' variant='ghost' size='icon' onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}>
                        <Trash2 /><span className='sr-only'>删除照片</span>
                      </Button>
                    </div>
                  </div>
                ))}
                {!images.length ? (
                  <div className='py-8 text-center text-sm text-muted-foreground'>选择照片后，可在这里调整格子位置和说明。</div>
                ) : null}
              </div>

              <Button disabled={uploading || updateWidget.isPending} onClick={saveGallery}>
                {updateWidget.isPending ? '保存中...' : '保存相册'}
              </Button>
            </CardContent>
          </Card>

          <Card className='xl:sticky xl:top-6'>
            <CardHeader>
              <CardTitle>排列预览</CardTitle>
              <CardDescription>直接拖动照片到任意格子；落到已有照片上时会交换位置。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-7 grid-rows-7 gap-2 rounded-md bg-muted/25 p-5 shadow-inner'>
                {Array.from({ length: 49 }, (_, slot) => (
                  <GalleryGridCell
                    key={slot}
                    slot={slot}
                    image={images.find((item) => item.slot === slot)}
                    isOver={dragOverSlot === slot}
                    onDragStart={handleGridDragStart}
                    onDragOver={(event, targetSlot) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                      setDragOverSlot((current) => (current === targetSlot ? current : targetSlot))
                    }}
                    onDrop={handleGridDrop}
                    onDragEnd={() => {
                      draggedSlot.current = null
                      setDragOverSlot(null)
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  )
}

function GalleryGridCell({
  slot,
  image,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  slot: number
  image?: GalleryImage
  isOver: boolean
  onDragStart: (event: React.DragEvent<HTMLDivElement>, slot: number) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>, slot: number) => void
  onDrop: (event: React.DragEvent<HTMLDivElement>, slot: number) => void
  onDragEnd: () => void
}) {
  return (
    <div
      draggable={Boolean(image)}
      onDragStart={(event) => image && onDragStart(event, slot)}
      onDragOver={(event) => onDragOver(event, slot)}
      onDrop={(event) => onDrop(event, slot)}
      onDragEnd={onDragEnd}
      className={`relative aspect-square overflow-hidden rounded-[5px] transition-[background-color,box-shadow,opacity] duration-150 ${
        image
          ? 'cursor-grab bg-background shadow-[0_3px_8px_rgba(15,23,42,0.12)] active:cursor-grabbing'
          : 'bg-background/45 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]'
      } ${isOver ? 'bg-primary/10 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]' : ''}`}
      aria-label={image ? `拖动格子 ${slot + 1} 的照片` : `空格子 ${slot + 1}`}
    >
      {image ? (
        <img src={image.url} alt='' loading='lazy' decoding='async' className='h-full w-full select-none object-cover' draggable={false} />
      ) : (
        <span className='grid h-full place-items-center text-[10px] text-muted-foreground/45'>{slot + 1}</span>
      )}
    </div>
  )
}

function normalizeGalleryImages(value: unknown): GalleryImage[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item && typeof item === 'object' && !Array.isArray(item))
    )
    .map((item, index) => ({
      url: typeof item.url === 'string' ? item.url : '',
      alt: typeof item.alt === 'string' ? item.alt : '',
      caption: typeof item.caption === 'string' ? item.caption : '',
      slot:
        typeof item.slot === 'number' && Number.isInteger(item.slot) && item.slot >= 0 && item.slot < 49
          ? item.slot
          : index,
    }))
    .filter((item) => item.url)
    .slice(0, 49)
}

async function optimizeGalleryImage(file: File) {
  if (file.type === 'image/gif') return file

  try {
    const bitmap = await createImageBitmap(file)
    const maxDimension = 1600
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.84)
    )
    if (!blob) return file
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}
