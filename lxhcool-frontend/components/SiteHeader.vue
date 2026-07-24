<script setup lang="ts">
import { Menu, X } from '@lucide/vue';

const route = useRoute();
const isMenuOpen = ref(false);

const navigation = [
  { label: '动态', path: '/', suffix: '.log' },
  { label: '文章', path: '/blog', suffix: '.md' },
  { label: '项目', path: '/projects', suffix: '.dir' },
  { label: '友链', path: '/friends', suffix: '.link' },
];

function isActive(path: string) {
  return path === '/' ? route.path === path : route.path.startsWith(path);
}

function closeMenu() {
  isMenuOpen.value = false;
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu();
}

watch(() => route.fullPath, closeMenu);
onMounted(() => window.addEventListener('keydown', handleEscape));
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape));
</script>

<template>
  <header class="site-header">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-[90px] bg-linear-to-b from-(--background-color-primary) to-transparent" />

    <div class="site-header__inner">
      <NuxtLink to="/" class="site-brand" aria-label="lxhcool 首页">
        <img
          class="site-brand__logo"
          src="/images/lxhcool.png"
          alt="lxhcool"
          width="1128"
          height="234"
        />
      </NuxtLink>

      <nav class="desktop-nav" aria-label="主要导航">
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="desktop-nav__link"
          :class="{ 'is-active': isActive(item.path) }"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <span>{{ item.label }}</span><small>{{ item.suffix }}</small>
        </NuxtLink>
      </nav>

      <button
        type="button"
        class="mobile-menu-button"
        :aria-expanded="isMenuOpen"
        aria-controls="site-mobile-menu"
        :aria-label="isMenuOpen ? '关闭导航菜单' : '打开导航菜单'"
        :title="isMenuOpen ? '关闭菜单' : '打开菜单'"
        @click="isMenuOpen = !isMenuOpen"
      >
        <X v-if="isMenuOpen" :size="17" :stroke-width="1.8" aria-hidden="true" />
        <Menu v-else :size="17" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </div>

    <Transition name="mobile-menu">
      <nav
        v-if="isMenuOpen"
        id="site-mobile-menu"
        class="mobile-nav"
        aria-label="移动端主要导航"
      >
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="mobile-nav__link"
          :class="{ 'is-active': isActive(item.path) }"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <span>{{ item.label }}</span>
          <small>{{ item.suffix }}</small>
        </NuxtLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.site-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  height: 64px;
}

.site-header__inner {
  position: relative;
  z-index: 1;
  display: flex;
  width: min(1280px, calc(100% - 48px));
  height: 58px;
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
}

.site-brand {
  display: inline-flex;
  width: 136px;
  height: 34px;
  align-items: center;
  flex: 0 0 136px;
}

.site-brand__logo {
  width: auto;
  height: 28px;
  object-fit: contain;
  object-position: left center;
}

:global(:root[data-theme='dark']) .site-brand__logo {
  filter: invert(1) hue-rotate(180deg) contrast(1.05);
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 3px;
}

.desktop-nav__link {
  position: relative;
  display: inline-flex;
  height: 30px;
  align-items: baseline;
  gap: 1px;
  padding: 0 9px;
  border-radius: 6px;
  color: var(--text-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 0;
  line-height: 30px;
  transition: color 140ms ease, background-color 140ms ease;
}

.desktop-nav__link small,
.mobile-nav__link small {
  color: color-mix(in srgb, var(--text-muted) 62%, transparent);
  font: inherit;
}

.desktop-nav__link:hover {
  background: color-mix(in srgb, var(--text) 5%, transparent);
  color: var(--text);
}

.desktop-nav__link.is-active {
  color: var(--text);
}

.desktop-nav__link.is-active::after {
  position: absolute;
  right: 9px;
  bottom: 1px;
  left: 9px;
  height: 1px;
  background: #4d9a75;
  content: '';
}

.site-brand:focus-visible,
.desktop-nav__link:focus-visible,
.mobile-nav__link:focus-visible,
.mobile-menu-button:focus-visible {
  outline: 2px solid rgba(77, 154, 117, 0.38);
  outline-offset: 3px;
}

.mobile-menu-button,
.mobile-nav {
  display: none;
}

@media (max-width: 680px) {
  .site-header__inner {
    width: calc(100% - 24px);
    height: 54px;
  }

  .site-brand {
    width: 116px;
    flex-basis: 116px;
  }

  .site-brand__logo {
    height: 24px;
  }

  .desktop-nav {
    display: none;
  }

  .mobile-menu-button {
    display: inline-grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 1px solid var(--paper-border);
    border-radius: 6px;
    background: color-mix(in srgb, var(--page-bg) 90%, transparent);
    color: var(--text);
    backdrop-filter: blur(12px);
  }

  .mobile-nav {
    position: absolute;
    z-index: 2;
    top: 54px;
    right: 12px;
    display: grid;
    width: 164px;
    padding: 5px;
    border: 1px solid var(--paper-border);
    border-radius: 7px;
    background: color-mix(in srgb, var(--card-bg) 94%, transparent);
    box-shadow: 0 14px 34px rgba(24, 28, 27, 0.12);
    backdrop-filter: blur(18px);
  }

  .mobile-nav__link {
    display: flex;
    min-height: 38px;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    border-radius: 5px;
    color: var(--text-muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0;
  }

  .mobile-nav__link:hover,
  .mobile-nav__link.is-active {
    background: color-mix(in srgb, var(--text) 6%, transparent);
    color: var(--text);
  }

  .mobile-nav__link.is-active::before {
    width: 4px;
    height: 4px;
    margin-right: 7px;
    border-radius: 50%;
    background: #4d9a75;
    content: '';
  }

  .mobile-nav__link.is-active span {
    margin-right: auto;
  }
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 130ms ease, transform 130ms ease;
  transform-origin: top right;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(.98);
}

@media (prefers-reduced-motion: reduce) {
  .desktop-nav__link,
  .mobile-menu-enter-active,
  .mobile-menu-leave-active {
    transition: none;
  }
}
</style>
