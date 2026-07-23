<script setup lang="ts">
const route = useRoute();
const items = [
  { label: '动态.log', to: '/' },
  { label: '文章.md', to: '/blog' },
  { label: '友链.link', to: '/friends' },
];

function isActive(to: string) {
  if (to === '/') return route.path === '/';
  return route.path.startsWith(to);
}
</script>

<template>
  <nav class="file-tabs" aria-label="主要导航">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="file-tab"
      :class="{ active: isActive(item.to) }"
    >
      <span class="file-status" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.file-tabs {
  display: flex;
  height: 46px;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  overflow-x: auto;
  border: 0;
  background: transparent;
  scrollbar-width: none;
}

.file-tabs::-webkit-scrollbar {
  display: none;
}

.file-tab {
  position: relative;
  display: inline-flex;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  color: #7d8790;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.015em;
  transition: color 130ms ease, background 130ms ease, transform 130ms ease;
}

.file-status {
  width: 4px;
  height: 4px;
  flex: 0 0 4px;
  border-radius: 50%;
  background: #4d9a75;
  opacity: 0;
  transition: background 130ms ease, box-shadow 130ms ease, opacity 130ms ease;
}

.file-tab:hover {
  background: rgba(11, 15, 19, 0.035);
  color: #46515a;
}

.file-tab.active {
  background: transparent;
  color: #26313a;
  font-weight: 600;
  transform: none;
}

.file-tab.active::after {
  position: absolute;
  bottom: -6px;
  left: 50%;
  width: 16px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: #4d9a75;
  content: '';
  transform: translateX(-50%);
}

.file-tab.active .file-status {
  background: #4d9a75;
  box-shadow: 0 0 0 3px rgba(77, 154, 117, 0.08);
  opacity: 1;
}

.file-tab:focus-visible {
  outline: 2px solid rgba(77, 154, 117, 0.3);
  outline-offset: -3px;
}

@media (max-width: 560px) {
  .file-tabs { height: 46px; justify-content: start; }
  .file-tab { height: 30px; padding-inline: 8px; font-size: 8.5px; }
}

@media (prefers-reduced-motion: reduce) {
  .file-tab,
  .file-status { transition: none; }
}
</style>
