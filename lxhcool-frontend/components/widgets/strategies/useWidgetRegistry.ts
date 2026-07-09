import type { WidgetType } from '~/entities/widget/model/types';
import type { WidgetStrategy } from './types';
import { useMusicPlayer } from './useMusicPlayer';
import { useHitokoto } from './useHitokoto';
import { useFriendLinks } from './useFriendLinks';
import { useProfile } from './useProfile';
import { useDateCard } from './useDateCard';
import { usePhotoGallery } from './usePhotoGallery';
import { useProjectTree } from './useProjectTree';

const registry: Record<WidgetType, WidgetStrategy> = {
  MUSIC_PLAYER: useMusicPlayer(),
  HITOKOTO: useHitokoto(),
  FRIEND_LINKS: useFriendLinks(),
  PROFILE: useProfile(),
  DATE_CARD: useDateCard(),
  PHOTO_GALLERY: usePhotoGallery(),
  PROJECT_TREE: useProjectTree(),
};

export function useWidgetRegistry() {
  function getStrategy(type: WidgetType): WidgetStrategy {
    return registry[type];
  }
  return { getStrategy, registry };
}
