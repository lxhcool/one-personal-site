import type { WidgetType } from '~/entities/widget/model/types';

export interface WidgetStrategy {
  /** 规范化配置数据 */
  normalize(config: Record<string, unknown>): Record<string, unknown>;
  /** 是否需要登录才显示，默认 true */
  requiresAuth?: boolean;
}

export interface WidgetStrategyRegistry {
  getStrategy(type: WidgetType): WidgetStrategy;
}
