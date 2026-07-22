export type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN'
export type PostType = 'ARTICLE' | 'MOMENT'
export type CategoryType = 'POST' | 'FRIEND_LINK'
export type WidgetArea = 'LEFT' | 'RIGHT'
export type WidgetVerticalPosition = 'TOP' | 'BOTTOM'
export type WidgetType =
  | 'MUSIC_PLAYER'
  | 'HITOKOTO'
  | 'FRIEND_LINKS'
  | 'PROFILE'
  | 'DATE_CARD'
  | 'PHOTO_GALLERY'
  | 'PROJECT_TREE'
  | 'KEYBOARD'

export type AdminUser = {
  id: string
  email: string
  name?: string | null
  avatar?: string | null
}

export type Post = {
  id: string
  type: PostType
  title: string
  slug: string
  category?: string | null
  excerpt?: string | null
  content: string
  media: Record<string, unknown>
  coverImage?: string | null
  status: PublishStatus
  publishedAt?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  ogImage?: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type Project = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  coverImage?: string | null
  gallery: string[]
  techStack: string[]
  liveUrl?: string | null
  githubUrl?: string | null
  featured: boolean
  sortOrder: number
  status: PublishStatus
  publishedAt?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  ogImage?: string | null
  createdAt: string
  updatedAt: string
}

export type FriendLink = {
  id: string
  name: string
  url: string
  category?: string | null
  logo?: string | null
  description?: string | null
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export type ContentCategory = {
  id: string
  type: CategoryType
  name: string
  logo?: string | null
  backgroundImage?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type SiteWidget = {
  id: string
  area: WidgetArea
  verticalPosition: WidgetVerticalPosition
  horizontalOffset: number
  verticalOffset: number
  rotation: number
  type: WidgetType
  title?: string | null
  enabled: boolean
  sortOrder: number
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
