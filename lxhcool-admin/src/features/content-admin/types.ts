import type { components } from '@/generated/api-schema'

export type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

export type Post = components['schemas']['PostResponseDto']
export type CreatePostPayload = components['schemas']['CreatePostDto']
export type UpdatePostPayload = components['schemas']['UpdatePostDto']
export type Project = components['schemas']['ProjectResponseDto']
export type CreateProjectPayload = components['schemas']['CreateProjectDto']
export type UpdateProjectPayload = components['schemas']['UpdateProjectDto']
export type FriendLink = components['schemas']['FriendLinkResponseDto']
export type CreateFriendLinkPayload = components['schemas']['CreateFriendLinkDto']
export type UpdateFriendLinkPayload = components['schemas']['UpdateFriendLinkDto']
export type SiteWidget = components['schemas']['WidgetResponseDto']
export type CreateWidgetPayload = components['schemas']['CreateWidgetDto']
export type UpdateWidgetPayload = components['schemas']['UpdateWidgetDto']
export type ContentCategory = components['schemas']['CategoryResponseDto']
export type CreateCategoryPayload = components['schemas']['CreateCategoryDto']
export type UpdateCategoryPayload = components['schemas']['UpdateCategoryDto']
export type NeteaseMetadata = components['schemas']['NeteaseMetadataResponseDto']
export type NeteasePlaylistTrack = components['schemas']['NeteasePlaylistTrackResponseDto']
export type NeteasePlaylist = components['schemas']['NeteasePlaylistResponseDto']
export type UploadResult = components['schemas']['UploadResponseDto']
export type PublishStatus = Post['status']
export type PostType = Post['type']
export type CategoryType = ContentCategory['type']
export type WidgetArea = SiteWidget['area']
export type WidgetVerticalPosition = SiteWidget['verticalPosition']
export type WidgetType = SiteWidget['type']

export type AdminUser = {
  id: string
  email: string
  name?: string | null
  avatar?: string | null
}
