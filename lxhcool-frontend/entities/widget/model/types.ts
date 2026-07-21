export type WidgetArea = 'LEFT' | 'RIGHT';
export type WidgetVerticalPosition = 'TOP' | 'BOTTOM';

export type WidgetType =
  | 'MUSIC_PLAYER'
  | 'HITOKOTO'
  | 'FRIEND_LINKS'
  | 'PROFILE'
  | 'DATE_CARD'
  | 'PHOTO_GALLERY'
  | 'PROJECT_TREE'
  | 'KEYBOARD';

export type SiteWidget = {
  id: string;
  area: WidgetArea;
  verticalPosition: WidgetVerticalPosition;
  rotation: number;
  type: WidgetType;
  title: string | null;
  enabled: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
