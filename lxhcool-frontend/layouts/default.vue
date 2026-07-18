<script setup lang="ts">
import { listPublicWidgets } from '~/entities/widget/api/widgetApi';
import { getCurrentAdminUser } from '~/entities/admin-user/api/authApi';
import Keyboard87 from '~/components/widgets/ui/Keyboard87.vue';
import StandaloneMusicPlayer from '~/components/widgets/ui/StandaloneMusicPlayer.vue';
import DateCardWidget from '~/components/widgets/ui/DateCardWidget.vue';
import PhotoGalleryWidget from '~/components/widgets/ui/PhotoGalleryWidget.vue';
import { useWidgetRegistry } from '~/components/widgets/strategies/useWidgetRegistry';

const theme = useState<'light' | 'dark'>('site-theme', () => 'light');
const [{ data: widgetsData }, { data: currentUser }] = await Promise.all([
  useAsyncData('public-widgets', () => listPublicWidgets()),
  useAsyncData('current-user', () => getCurrentAdminUser()),
]);

const isLoggedIn = computed(() => currentUser.value != null);

/* ── Corner project tree (static) ── */
interface TreeNode { name: string; type: 'folder' | 'file'; children?: TreeNode[] }

function flattenTree(node: TreeNode, depth: number): Array<{ name: string; type: 'folder' | 'file'; depth: number; last: boolean; collapsed: boolean }> {
  const result: Array<{ name: string; type: 'folder' | 'file'; depth: number; last: boolean; collapsed: boolean }> = [];
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;
  result.push({ name: node.name, type: node.type, depth, last: false, collapsed: node.type === 'folder' && !hasChildren });
  if (node.children) {
    node.children.forEach((child, i) => {
      const items = flattenTree(child, depth + 1);
      if (i === node.children!.length - 1) {
        items[0].last = true;
      }
      result.push(...items);
    });
  }
  return result;
}

const frontendTree: TreeNode = {
  name: 'lxhcool-frontend',
  type: 'folder',
  children: [
    { name: 'public', type: 'folder', children: [
      { name: 'images', type: 'folder' },
      { name: 'fonts', type: 'folder', children: [
        { name: 'lxhcool.woff2', type: 'file' },
        { name: 'lxhcool-bold.woff2', type: 'file' },
        { name: 'lxhcool-mono.woff2', type: 'file' },
      ] },
    ] },
    { name: 'pages', type: 'folder' },
    { name: 'entities', type: 'folder' },
    { name: 'layouts', type: 'folder' },
    { name: 'composables', type: 'folder' },
    { name: 'app.vue', type: 'file' },
    { name: 'nuxt.config.ts', type: 'file' },
    { name: 'tailwind.config.ts', type: 'file' },
    { name: 'package.json', type: 'file' },
  ],
};

const flatTree = flattenTree(frontendTree, 0).slice(1);

onMounted(() => {
  const storedTheme = window.localStorage.getItem('site-theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    theme.value = storedTheme;
  }
  applyTheme();
});

watch(theme, () => applyTheme());

const { getStrategy } = useWidgetRegistry();

const widgets = computed(() => {
  const all = widgetsData.value ?? [];
  if (isLoggedIn.value) return all;
  return all.filter((w) => !getStrategy(w.type).requiresAuth);
});
const rightWidgets = computed(() => widgets.value.filter((widget) => widget.area === 'RIGHT'));
const photoGalleryWidget = computed(() =>
  rightWidgets.value.find((widget) => widget.type === 'PHOTO_GALLERY'),
);
const photoGalleryNormalized = computed(() =>
  photoGalleryWidget.value
    ? getStrategy(photoGalleryWidget.value.type).normalize(photoGalleryWidget.value.config)
    : {},
);
function applyTheme() {
  if (import.meta.server) return;
  document.documentElement.dataset.theme = theme.value;
  window.localStorage.setItem('site-theme', theme.value);
}
</script>

<template>
  <div class="fixed top-[1.625rem] left-[1.875rem] rounded-lg p-3 z-10 flex flex-col gap-y-2" style="transform: matrix(0.799513, -0.04, 0.04, 0.799513, 0, 0) translate(-58px, -88px)">
    <template v-for="(item, idx) in flatTree" :key="idx">
      <div
        class="tree-item flex flex-row items-center gap-2.5 text-[15px] whitespace-nowrap text-[hsl(212,20%,23%)]"
        :class="{ 'tree-folder': item.type === 'folder', 'tree-collapsed': item.collapsed }"
        :style="{ paddingLeft: `${item.depth * 24}px` }"
      >
        <span class="truncate">{{ item.name }}</span>
      </div>
    </template>
  </div>
  <div class="site-shell">
    <main class="content-column">
      <slot />
    </main>
  </div>

  <div class="fixed z-10 scale-75 origin-bottom-left -left-5 bottom-[340px]">
    <Keyboard87 />
  </div>

  <div class="fixed z-10 left-6 bottom-4">
    <StandaloneMusicPlayer />
  </div>

  <div class="fixed z-10 calendar-side">
    <DateCardWidget />
  </div>

  <div v-if="photoGalleryWidget" class="fixed z-10 gallery-side">
    <PhotoGalleryWidget :widget="photoGalleryWidget" :normalized="photoGalleryNormalized" />
  </div>
</template>

<style scoped>
.site-shell {
  display: grid;
  grid-template-columns: var(--center-column);
  gap: var(--shell-gap);
  width: var(--center-column);
  max-width: calc(100vw - 32px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px 0 0;
}

.shell-column {
  display: grid;
  align-content: start;
  gap: 16px;
  width: 260px;
}

.shell-column-left,
.shell-column-right {
  position: sticky;
  top: 24px;
  height: fit-content;
}

.content-column {
  min-width: 0;
}

.content-column :deep(main) {
  min-height: 320px;
  padding: 0;
}

@media (max-width: 1220px) {
  .site-shell {
    grid-template-columns: minmax(0, var(--center-column));
    justify-content: center;
    width: var(--center-column);
  }

  .shell-column-left,
  .shell-column-right {
    display: none;
  }
}

@media (max-width: 680px) {
  .site-shell {
    max-width: none;
    width: 100%;
    padding: 12px 12px 0;
  }
}

.tree-folder::before {
  content: '';
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='0.75rem' height='0.75rem' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2329323D' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: cover;
}

.tree-collapsed::before {
  transform: rotate(-90deg);
}

.calendar-side {
  top: 50%;
  right: -40px;
  width: 260px;
  transform: translateY(-50%) rotate(-2deg);
}

.gallery-side {
  right: -8px;
  bottom: 52px;
  transform-origin: bottom right;
}

@media (max-width: 1320px) {
  .calendar-side,
  .gallery-side {
    display: none;
  }
}
</style>


