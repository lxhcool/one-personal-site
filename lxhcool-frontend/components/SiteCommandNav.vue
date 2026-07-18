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
  height: 42px;
  min-width: 0;
  align-items: stretch;
  justify-content: center;
  gap: 1px;
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
  height: 42px;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  padding: 0 11px;
  border: 0;
  border-radius: 0;
  color: #7e878c;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.015em;
  transition: color 130ms ease, background 130ms ease, transform 130ms ease;
}

.file-status {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: #a2a9a7;
  opacity: 0.42;
  transition: background 130ms ease, box-shadow 130ms ease, opacity 130ms ease;
}

.file-tab:hover {
  background: rgba(235, 228, 215, 0.24);
  color: #535f66;
}

.file-tab.active {
  background: rgba(235, 228, 215, 0.34);
  color: #3f4b52;
  transform: none;
}

.file-tab.active::after {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: rgba(77, 154, 117, 0.62);
  content: '';
  transform: translateX(-50%);
}

.file-tab.active .file-status {
  background: #4d9a75;
  box-shadow: 0 0 0 3px rgba(77, 154, 117, 0.1);
  opacity: 1;
}

.file-tab:focus-visible {
  outline: 2px solid rgba(77, 154, 117, 0.3);
  outline-offset: -3px;
}

@media (max-width: 560px) {
  .file-tabs { height: 42px; justify-content: start; }
  .file-tab { height: 42px; padding-inline: 8px; font-size: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .file-tab,
  .file-status { transition: none; }
}
</style>
