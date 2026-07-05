import type { Component } from 'vue';
import type { SiteWidget, WidgetType } from '~/entities/widget/model/types';

export type WidgetStrategy<TConfig extends Record<string, unknown> = Record<string, unknown>> = {
  type: WidgetType;
  component: Component;
  normalizeConfig: (raw: Record<string, unknown>) => TConfig;
  shouldRender?: (widget: SiteWidget) => boolean;
};
