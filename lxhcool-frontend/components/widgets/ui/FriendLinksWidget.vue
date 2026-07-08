<script setup lang="ts">
import type { SiteWidget } from '~/entities/widget/model/types';
import { useFriendLinksSetup } from '../strategies/useFriendLinks';

const props = defineProps<{ widget: SiteWidget; normalized: Record<string, unknown> }>();

const widgetRef = toRef(props, 'widget');
const { friendLinks } = useFriendLinksSetup(widgetRef);
</script>

<template>
  <div class="links-card">
    <div class="widget-heading">{{ widget.title || '友情链接' }}</div>
    <div class="links-list">
      <a v-for="link in friendLinks" :key="link.id" :href="link.url" target="_blank" class="link-item">
        <img v-if="link.logo" :src="link.logo" :alt="link.name" class="link-logo" />
        <span v-else class="link-fallback">{{ link.name.slice(0, 1) }}</span>
        <span class="link-name">{{ link.name }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.links-card {
  padding: 16px 18px 18px;
}

.links-list {
  display: grid;
  gap: 4px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-sm);
  padding: 9px 10px;
  transition: background-color 0.15s ease;
  text-decoration: none;
}

.link-item:hover {
  background: var(--hover-bg);
}

.link-logo,
.link-fallback {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: var(--hover-bg);
  object-fit: cover;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.link-name {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
}

.link-item:hover .link-name {
  color: var(--accent);
}
</style>
