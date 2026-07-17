<script setup lang="ts">
const route = useRoute();
const items = [
  { label: '动态', command: 'moments', to: '/' },
  { label: '文章', command: 'articles', to: '/blog' },
  { label: '友链', command: 'friends', to: '/friends' },
];

function isActive(to: string) {
  if (to === '/') return route.path === '/';
  return route.path.startsWith(to);
}
</script>

<template>
  <nav class="command-nav" aria-label="主要导航">
    <span class="nav-prompt" aria-hidden="true">~/desk $ open</span>
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav-link"
      :class="{ active: isActive(item.to) }"
    >
      <span>{{ item.label }}</span>
      <small>{{ item.command }}</small>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.command-nav {
  display: flex;
  align-items: stretch;
  min-height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid rgba(105, 91, 72, 0.1);
  background: rgba(225, 218, 205, 0.32);
  font-family: 'IBM Plex Mono', monospace;
}

.nav-prompt {
  display: flex;
  align-items: center;
  margin-right: auto;
  padding: 0 12px 0 2px;
  color: #89929a;
  font-size: 10px;
  white-space: nowrap;
}

.nav-link {
  position: relative;
  display: grid;
  place-content: center;
  min-width: 64px;
  padding: 6px 10px 5px;
  color: #7c858c;
  text-align: center;
  transition: color 140ms ease, background 140ms ease;
}

.nav-link span { font-size: 11px; font-weight: 700; }
.nav-link small { margin-top: 1px; font-size: 7px; letter-spacing: 0.05em; opacity: 0.62; }

.nav-link::after {
  position: absolute;
  right: 12px;
  bottom: -1px;
  left: 12px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: #6751ad;
  content: '';
  opacity: 0;
  transform: scaleX(0.5);
  transition: opacity 140ms ease, transform 140ms ease;
}

.nav-link:hover,
.nav-link.active { color: #35414a; background: rgba(77, 86, 94, 0.035); }
.nav-link.active::after { opacity: 1; transform: scaleX(1); }
.nav-link:focus-visible { outline: 2px solid rgba(103, 81, 173, 0.35); outline-offset: -3px; }

@media (max-width: 560px) {
  .command-nav { overflow-x: auto; padding: 0 6px; }
  .nav-prompt { display: none; }
  .nav-link { flex: 1 0 62px; min-width: 62px; padding-inline: 6px; }
}
</style>
