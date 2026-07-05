import { useEffect, useRef, useState } from 'react'
import type * as React from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { marked } from 'marked'
import TurndownService from 'turndown'
import {
  Bold,
  Code,
  Heading2,
  ImagePlus,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { uploadsApi } from '../api'

const turndown = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
})

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [tab, setTab] = useState('editor')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastExternalValue = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-md border',
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-96 px-4 py-3 outline-none',
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const markdown = htmlToMarkdown(activeEditor.getHTML())
      lastExternalValue.current = markdown
      onChange(markdown)
    },
  })

  useEffect(() => {
    if (!editor || value === lastExternalValue.current) return
    lastExternalValue.current = value
    editor.commands.setContent(markdownToHtml(value), { emitUpdate: false })
  }, [editor, value])

  function syncMarkdown(nextValue: string) {
    lastExternalValue.current = nextValue
    onChange(nextValue)
    editor?.commands.setContent(markdownToHtml(nextValue), { emitUpdate: false })
  }

  function setLink() {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('输入链接地址', previousUrl ?? '')

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  async function uploadImage(file: File) {
    if (!editor) return
    setIsUploading(true)
    try {
      const image = await uploadsApi.image(file)
      editor.chain().focus().setImage({ src: image.url }).run()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片上传失败')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className='gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <TabsList>
          <TabsTrigger value='editor'>可视化</TabsTrigger>
          <TabsTrigger value='markdown'>Markdown</TabsTrigger>
        </TabsList>

        <div className='flex flex-wrap items-center gap-1'>
          <ToolbarButton
            label='加粗'
            active={editor?.isActive('bold')}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold />
          </ToolbarButton>
          <ToolbarButton
            label='斜体'
            active={editor?.isActive('italic')}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic />
          </ToolbarButton>
          <ToolbarButton
            label='二级标题'
            active={editor?.isActive('heading', { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 />
          </ToolbarButton>
          <ToolbarButton
            label='引用'
            active={editor?.isActive('blockquote')}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote />
          </ToolbarButton>
          <ToolbarButton
            label='代码块'
            active={editor?.isActive('codeBlock')}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            <Code />
          </ToolbarButton>
          <ToolbarButton
            label='无序列表'
            active={editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List />
          </ToolbarButton>
          <ToolbarButton
            label='有序列表'
            active={editor?.isActive('orderedList')}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered />
          </ToolbarButton>
          <Separator orientation='vertical' className='mx-1 h-6' />
          <ToolbarButton label='链接' onClick={setLink}>
            <LinkIcon />
          </ToolbarButton>
          <ToolbarButton
            label='上传图片'
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus />
          </ToolbarButton>
          <Separator orientation='vertical' className='mx-1 h-6' />
          <ToolbarButton label='撤销' onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 />
          </ToolbarButton>
          <ToolbarButton label='重做' onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 />
          </ToolbarButton>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/gif'
        className='hidden'
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) void uploadImage(file)
        }}
      />

      <TabsContent value='editor' className='mt-0'>
        <div className='min-h-96 overflow-hidden rounded-md border bg-background'>
          <EditorContent editor={editor} />
        </div>
      </TabsContent>
      <TabsContent value='markdown' className='mt-0'>
        <Textarea
          value={value}
          onChange={(event) => syncMarkdown(event.currentTarget.value)}
          className='min-h-96 font-mono text-sm'
          required
        />
      </TabsContent>
    </Tabs>
  )
}

function ToolbarButton({
  label,
  active,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string
  active?: boolean
}) {
  return (
    <Button
      type='button'
      variant={active ? 'secondary' : 'ghost'}
      size='icon'
      title={label}
      aria-label={label}
      className={cn('size-8', className)}
      {...props}
    />
  )
}

function markdownToHtml(markdown: string) {
  return marked.parse(markdown, { async: false }) as string
}

function htmlToMarkdown(html: string) {
  return turndown.turndown(html).trim()
}
