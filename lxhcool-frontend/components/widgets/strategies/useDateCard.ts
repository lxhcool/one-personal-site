import type { WidgetStrategy } from './types';
import type { SiteWidget } from '~/entities/widget/model/types';
import { readBoolean, readString } from './shared';

export function useDateCard(): WidgetStrategy {
  return {
    normalize(config) {
      return {
        showTime: readBoolean(config, 'showTime', true),
        siteStartDate: readString(config, 'siteStartDate'),
      };
    },
  };
}

export function useDateCardSetup(_widget: Ref<SiteWidget>) {
  const now = ref(new Date());
  let timer: ReturnType<typeof setInterval> | undefined;

  onMounted(() => { timer = setInterval(() => { now.value = new Date(); }, 1000); });
  onBeforeUnmount(() => { if (timer) clearInterval(timer); });

  const dateText = computed(() =>
    new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(now.value),
  );
  const timeText = computed(() =>
    new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(now.value),
  );

  return { dateText, timeText };
}
