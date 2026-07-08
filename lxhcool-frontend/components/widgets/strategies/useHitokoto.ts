import type { WidgetStrategy } from './types';
import type { SiteWidget } from '~/entities/widget/model/types';
import { readArray, readString } from './shared';

type HitokotoSentence = {
  hitokoto: string;
  from?: string | null;
  from_who?: string | null;
};

export function useHitokoto(): WidgetStrategy {
  return {
    normalize(config) {
      return {
        text: readString(config, 'text', '\u613f\u4f60\u6709\u524d\u8fdb\u4e00\u6b65\u7684\u52c7\u6c14\u3002'),
        from: readString(config, 'from'),
        category: readString(config, 'category'),
        categories: readArray<string>(config, 'categories'),
      };
    },
  };
}

export function useHitokotoSetup(widget: Ref<SiteWidget>) {
  const hitokotoCategories = computed(() => {
    const cfg = widget.value.config ?? {};
    const categories = [readString(cfg, 'category'), ...readArray<string>(cfg, 'categories')];
    return [...new Set(categories.filter(Boolean))];
  });

  const hitokotoQuery = computed(() =>
    hitokotoCategories.value.length > 0 ? { c: hitokotoCategories.value } : undefined,
  );

  const { data: remoteHitokoto, pending: isHitokotoPending, refresh: refreshHitokoto } = useAsyncData(
    `widget-hitokoto-${widget.value.id}`,
    () =>
      $fetch<HitokotoSentence>('https://v1.hitokoto.cn/', {
        query: hitokotoQuery.value,
        timeout: 5000,
      }).catch(() => null),
    { server: false, watch: [hitokotoQuery] },
  );

  const hitokotoText = computed(() => {
    const fallback = readString(widget.value.config ?? {}, 'text');
    return remoteHitokoto.value?.hitokoto || fallback || '\u613f\u4f60\u6709\u524d\u8fdb\u4e00\u6b65\u7684\u52c7\u6c14\u3002';
  });

  const hitokotoSource = computed(() => {
    const fallback = readString(widget.value.config ?? {}, 'from');
    const parts = [remoteHitokoto.value?.from_who, remoteHitokoto.value?.from]
      .filter(Boolean)
      .filter((item, index, source) => source.indexOf(item) === index);
    return parts.join(' / ') || fallback || '';
  });

  function handleRefreshHitokoto() { void refreshHitokoto(); }

  return { hitokotoText, hitokotoSource, isHitokotoPending, handleRefreshHitokoto };
}
