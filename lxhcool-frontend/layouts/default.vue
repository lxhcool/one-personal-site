<script setup lang="ts">
import { listPublicWidgets } from '~/entities/widget/api/widgetApi';
import { getCurrentAdminUser } from '~/entities/admin-user/api/authApi';
import Keyboard87 from '~/components/widgets/ui/Keyboard87.vue';
import StandaloneMusicPlayer from '~/components/widgets/ui/StandaloneMusicPlayer.vue';
import DateCardWidget from '~/components/widgets/ui/DateCardWidget.vue';
import PhotoGalleryWidget from '~/components/widgets/ui/PhotoGalleryWidget.vue';
import ImageLightbox from '~/components/media/ImageLightbox.vue';
import { useWidgetRegistry } from '~/components/widgets/strategies/useWidgetRegistry';
import type { SiteWidget, WidgetArea, WidgetVerticalPosition } from '~/entities/widget/model/types';

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
  const renderedTheme = document.documentElement.dataset.theme;
  if (renderedTheme === 'dark' || renderedTheme === 'light') {
    theme.value = renderedTheme;
  }
});

const { getStrategy } = useWidgetRegistry();

const widgets = computed(() => {
  const all = widgetsData.value ?? [];
  if (isLoggedIn.value) return all;
  return all.filter((w) => !getStrategy(w.type).requiresAuth);
});

type WidgetCorner = 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

const widgetCorners: WidgetCorner[] = [
  'left-top',
  'left-bottom',
  'right-top',
  'right-bottom',
];

const widgetsByCorner = computed<Record<WidgetCorner, SiteWidget[]>>(() => {
  const groups: Record<WidgetCorner, SiteWidget[]> = {
    'left-top': [],
    'left-bottom': [],
    'right-top': [],
    'right-bottom': [],
  };

  for (const widget of widgets.value) {
    groups[getWidgetCorner(widget)].push(widget);
  }

  for (const corner of widgetCorners) {
    groups[corner].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return groups;
});

function getWidgetCorner(widget: SiteWidget): WidgetCorner {
  const area: WidgetArea = widget.area === 'RIGHT' ? 'RIGHT' : 'LEFT';
  const verticalPosition: WidgetVerticalPosition =
    widget.verticalPosition === 'BOTTOM' ? 'BOTTOM' : 'TOP';
  return `${area.toLowerCase()}-${verticalPosition.toLowerCase()}` as WidgetCorner;
}

function getWidgetRotation(widget: SiteWidget) {
  const rotation = Number(widget.rotation);
  return Number.isFinite(rotation) ? Math.max(-45, Math.min(45, rotation)) : 0;
}

function normalizeWidget(widget: SiteWidget) {
  return getStrategy(widget.type).normalize(widget.config ?? {});
}
</script>

<template>
  <div class="site-shell">
    <main class="content-column">
      <slot />
    </main>
  </div>

  <div
    v-for="corner in widgetCorners"
    :key="corner"
    class="widget-zone"
    :class="`widget-zone-${corner}`"
  >
    <div
      v-for="widget in widgetsByCorner[corner]"
      :key="widget.id"
      class="widget-positioned"
      :class="`widget-type-${widget.type}`"
      :style="{ '--widget-rotation': `${getWidgetRotation(widget)}deg` }"
    >
      <div v-if="widget.type === 'PROJECT_TREE'" class="project-tree-widget rounded-lg p-3">
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
      <div v-else-if="widget.type === 'KEYBOARD'" class="keyboard-widget">
        <Keyboard87 />
      </div>
      <StandaloneMusicPlayer v-else-if="widget.type === 'MUSIC_PLAYER'" />
      <DateCardWidget
        v-else-if="widget.type === 'DATE_CARD'"
        :widget="widget"
        :normalized="normalizeWidget(widget)"
      />
      <PhotoGalleryWidget
        v-else-if="widget.type === 'PHOTO_GALLERY'"
        :widget="widget"
        :normalized="normalizeWidget(widget)"
      />
      <WidgetRenderer v-else :widget="widget" />
    </div>
  </div>

  <PullCordThemeToggle />
  <ImageLightbox />
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

.widget-zone {
  position: fixed;
  z-index: 10;
  display: flex;
  max-height: calc(100vh - 40px);
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.widget-zone-left-top {
  top: 22px;
  left: 24px;
  align-items: flex-start;
}

.widget-zone-right-top {
  top: 82px;
  right: 20px;
  align-items: flex-end;
}

.widget-zone-left-bottom {
  bottom: 16px;
  left: 24px;
  flex-direction: column-reverse;
  align-items: flex-start;
}

.widget-zone-right-bottom {
  right: 20px;
  bottom: 28px;
  flex-direction: column-reverse;
  align-items: flex-end;
}

.widget-positioned {
  pointer-events: auto;
  transform: rotate(var(--widget-rotation, 0deg));
  transform-origin: center;
}

.widget-type-DATE_CARD {
  width: 260px;
}

.widget-type-PHOTO_GALLERY {
  transform-origin: bottom right;
}

.project-tree-widget {
  transform: scale(.8);
  transform-origin: top left;
}

.keyboard-widget {
  margin-left: -44px;
  transform: scale(.75);
  transform-origin: bottom left;
}

@media (max-width: 1320px) {
  .widget-type-DATE_CARD,
  .widget-type-PHOTO_GALLERY,
  .widget-type-HITOKOTO,
  .widget-type-FRIEND_LINKS,
  .widget-type-PROFILE {
    display: none;
  }
}
</style>


