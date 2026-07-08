import type { WidgetStrategy } from './types';
import { readArray } from './shared';

export function usePhotoGallery(): WidgetStrategy {
  return {
    normalize(config) {
      return {
        images: readArray<{ url: string; alt?: string; caption?: string }>(config, 'images'),
      };
    },
  };
}
