<script setup lang="ts">
import type { SiteWidget } from '~/entities/widget/model/types';
import { useDateCardSetup } from '../strategies/useDateCard';

const props = defineProps<{ widget: SiteWidget; normalized: Record<string, unknown> }>();

const widgetRef = toRef(props, 'widget');
const { dateText, timeText } = useDateCardSetup(widgetRef);
</script>

<template>
  <div class="date-card">
    <div class="widget-heading">{{ widget.title || '日期' }}</div>
    <div class="date-main">
      <span class="date-text">{{ dateText }}</span>
      <span v-if="normalized.showTime" class="time-text">{{ timeText }}</span>
    </div>
  </div>
</template>

<style scoped>
.date-card {
  padding: 16px 18px 18px;
}

.date-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-text {
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.time-text {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}
</style>
