<script setup lang="ts">
import { Menu, X } from '@lucide/vue';

const route = useRoute();
const isMenuOpen = ref(false);

const navigation = [
  { label: '动态', path: '/' },
  { label: '文章', path: '/blog' },
  { label: '项目', path: '/projects' },
  { label: '友链', path: '/friends' },
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
          {{ item.label }}
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
          {{ item.label }}
        </NuxtLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  display: flex;
  width: 220px;
  height: 100vh;
  padding: 28px 20px 24px;
  border-right: none;
  background: var(--background-color-primary);
  flex-direction: column;
}

.site-header__inner {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: flex-start;
  flex-direction: column;
  gap: 0;
}

.site-brand {
  display: flex;
  align-self: stretch;
  width: 100%;
  height: 32px;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  color: var(--navigation-text);
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  margin-right: 12px;
  margin-bottom: 36px;
  margin-left: 4px;
  text-decoration: none;
  transition: color .15s;
}

.site-brand__logo {
  width: 148px;
  height: 16px;
  object-fit: contain;
  object-position: left center;
  filter: var(--site-logo-filter);
}

.desktop-nav {
  display: flex;
  width: 100%;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
}

.desktop-nav__link {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 8px;
  color: var(--navigation-text);
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  text-decoration: none;
  transition: color .15s;
}

.desktop-nav__link:hover {
  color: var(--navigation-text-hover);
}

.desktop-nav__link.is-active {
  color: var(--navigation-text-active);
}

.site-brand:focus-visible,
.desktop-nav__link:focus-visible,
.mobile-nav__link:focus-visible,
.mobile-menu-button:focus-visible {
  outline: 2px solid var(--navigation-focus-ring);
  outline-offset: 3px;
}

.mobile-menu-button,
.mobile-nav {
  display: none;
}

@media (max-width: 1120px) {
  .site-header {
    right: 0;
    display: block;
    width: auto;
    height: 64px;
    padding: 0;
    background: linear-gradient(to bottom, var(--background-color-primary), transparent);
  }

  .site-header__inner {
    position: relative;
    z-index: 1;
    width: calc(100% - 20px);
    height: 54px;
    margin: 0 auto;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
    gap: 28px;
  }

  .site-brand {
    width: 116px;
    height: 34px;
    margin: 0;
    flex-basis: 116px;
  }

  .site-brand__logo {
    height: 16px;
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
    padding: 0 10px;
    color: var(--navigation-text);
    font-size: 13px;
    font-weight: 500;
  }

  .mobile-nav__link:hover {
    color: var(--navigation-text-hover);
  }

  .mobile-nav__link.is-active {
    color: var(--navigation-text-active);
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
