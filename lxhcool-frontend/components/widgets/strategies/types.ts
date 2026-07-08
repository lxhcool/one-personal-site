import type { WidgetType } from '~/entities/widget/model/types';

export interface WidgetStrategy {
  /** 规范化配置数据 */
  normalize(config: Record<string, unknown>): Record<string, unknown>;
}

export interface WidgetStrategyRegistry {
  getStrategy(type: WidgetType): WidgetStrategy;
}
