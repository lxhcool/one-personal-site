import type { WidgetStrategy } from './types';

export function useKeyboard(): WidgetStrategy {
  return {
    normalize(config) {
      return config;
    },
  };
}
