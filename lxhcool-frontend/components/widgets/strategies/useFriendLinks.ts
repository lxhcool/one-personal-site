import type { WidgetStrategy } from './types';
import type { SiteWidget } from '~/entities/widget/model/types';
import { readBoolean, readNumber, readString } from './shared';
import { listPublicFriendLinks } from '~/entities/friend-link/api/friendLinkApi';

export function useFriendLinks(): WidgetStrategy {
  return {
    normalize(config) {
      return {
        category: readString(config, 'category'),
        limit: readNumber(config, 'limit', 6),
        random: readBoolean(config, 'random'),
      };
    },
  };
}

export function useFriendLinksSetup(widget: Ref<SiteWidget>) {
  const friendConfig = computed(() => {
    const cfg = widget.value.config ?? {};
    return {
      category: readString(cfg, 'category'),
      limit: readNumber(cfg, 'limit', 6),
      random: readBoolean(cfg, 'random'),
    };
  });

  const { data: friendLinksData } = useAsyncData(
    `widget-friend-links-${widget.value.id}`,
    () => listPublicFriendLinks(),
  );

  const friendLinks = computed(() => {
    if (!friendConfig.value) return [];
    const filtered = (friendLinksData.value ?? []).filter((link) =>
      friendConfig.value?.category ? link.category === friendConfig.value.category : true,
    );
    const ordered = friendConfig.value.random
      ? [...filtered].sort(() => Math.random() - 0.5)
      : filtered;
    return ordered.slice(0, friendConfig.value.limit || 6);
  });

  return { friendLinks };
}
