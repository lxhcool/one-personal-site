import type { WidgetType } from '~/entities/widget/model/types';
import type { WidgetStrategy } from './types';
import { useMusicPlayer } from './useMusicPlayer';
import { useHitokoto } from './useHitokoto';
import { useFriendLinks } from './useFriendLinks';
import { useDateCard } from './useDateCard';
import { usePhotoGallery } from './usePhotoGallery';
import { useProjectTree } from './useProjectTree';
import { useKeyboard } from './useKeyboard';

const registry: Record<WidgetType, WidgetStrategy> = {
  MUSIC_PLAYER: useMusicPlayer(),
  HITOKOTO: useHitokoto(),
  FRIEND_LINKS: useFriendLinks(),
  DATE_CARD: useDateCard(),
  PHOTO_GALLERY: usePhotoGallery(),
  PROJECT_TREE: useProjectTree(),
  KEYBOARD: useKeyboard(),
};

export function useWidgetRegistry() {
  function getStrategy(type: WidgetType): WidgetStrategy {
    return registry[type] ?? { normalize: (c) => c, requiresAuth: true };
  }
  return { getStrategy, registry };
}
