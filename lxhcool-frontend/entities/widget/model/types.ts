export type WidgetArea = 'LEFT' | 'RIGHT';

export type WidgetType =
  | 'MUSIC_PLAYER'
  | 'HITOKOTO'
  | 'FRIEND_LINKS'
  | 'PROFILE'
  | 'DATE_CARD'
  | 'PHOTO_GALLERY';

export type SiteWidget = {
  id: string;
  area: WidgetArea;
  type: WidgetType;
  title: string | null;
  enabled: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
