import type { components } from '~/shared/api/generated/api-schema';

export type SiteWidget = components['schemas']['WidgetResponseDto'];
export type WidgetArea = SiteWidget['area'];
export type WidgetVerticalPosition = SiteWidget['verticalPosition'];
export type WidgetType = SiteWidget['type'];
