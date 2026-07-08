<script setup lang="ts">
import type { SiteWidget } from '~/entities/widget/model/types';
import { useHitokotoSetup } from '../strategies/useHitokoto';
import { RefreshCw } from '@lucide/vue';

const props = defineProps<{ widget: SiteWidget; normalized: Record<string, unknown> }>();

const widgetRef = toRef(props, 'widget');
const { hitokotoText, hitokotoSource, isHitokotoPending, handleRefreshHitokoto } = useHitokotoSetup(widgetRef);
</script>

<template>
  <div class="hitokoto-card">
    <div class="hitokoto-head">
      <span class="widget-heading">一言</span>
      <button type="button" class="hitokoto-refresh"
        :class="{ loading: isHitokotoPending }" aria-label="换一句"
        :disabled="isHitokotoPending" @click="handleRefreshHitokoto">
        <RefreshCw :size="14" stroke-width="1.8" />
      </button>
    </div>
    <div class="hitokoto-body">
      <Transition name="hitokoto-text" mode="out-in">
        <p :key="hitokotoText" class="hitokoto-content">{{ hitokotoText }}</p>
      </Transition>
      <Transition name="hitokoto-source" mode="out-in">
        <span v-if="hitokotoSource" :key="hitokotoSource" class="hitokoto-from">{{ hitokotoSource }}</span>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.hitokoto-card {
  display: flex;
  flex-direction: column;
  padding: 16px 18px 18px;
}

.hitokoto-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.hitokoto-head .widget-heading {
  margin-bottom: 0;
}

.hitokoto-refresh {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--hover-bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.hitokoto-refresh:hover:not(:disabled) {
  background: var(--hover-bg-strong);
  transform: rotate(15deg);
}

.hitokoto-refresh:disabled {
  cursor: default;
  opacity: 0.6;
}

.hitokoto-refresh.loading svg {
  animation: hitokoto-spin 0.8s linear infinite;
}

.hitokoto-body {
  position: relative;
  display: grid;
  gap: 10px;
  min-height: 100px;
}

.hitokoto-content {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 530;
  line-height: 1.75;
}

.hitokoto-from {
  display: block;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: right;
}

.hitokoto-text-enter-active,
.hitokoto-text-leave-active,
.hitokoto-source-enter-active,
.hitokoto-source-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.hitokoto-text-enter-from,
.hitokoto-source-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.hitokoto-text-leave-to,
.hitokoto-source-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes hitokoto-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
