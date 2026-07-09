import type { WidgetStrategy } from './types';
import { readNumber } from './shared';

export function useProjectTree(): WidgetStrategy {
  return {
    requiresAuth: false,
    normalize(config) {
      return {
        maxDepth: readNumber(config, 'maxDepth', 2),
      };
    },
  };
}
