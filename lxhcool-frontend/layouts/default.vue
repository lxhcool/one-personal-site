<script setup lang="ts">
import { listPublicWidgets } from '~/entities/widget/api/widgetApi';
import { getCurrentAdminUser } from '~/entities/admin-user/api/authApi';
import Keyboard87 from '~/components/widgets/ui/Keyboard87.vue';
import StandaloneMusicPlayer from '~/components/widgets/ui/StandaloneMusicPlayer.vue';
import DateCardWidget from '~/components/widgets/ui/DateCardWidget.vue';
import PhotoGalleryWidget from '~/components/widgets/ui/PhotoGalleryWidget.vue';
import ImageLightbox from '~/components/media/ImageLightbox.vue';
import WidgetRenderer from '~/components/widgets/WidgetRenderer.vue';
import { useWidgetRegistry } from '~/components/widgets/strategies/useWidgetRegistry';
import type { SiteWidget, WidgetArea, WidgetVerticalPosition } from '~/entities/widget/model/types';

const route = useRoute();
const isWidgetEditor = computed(() => route.query.widgetEditor === '1');
const theme = useState<'light' | 'dark'>('site-theme', () => 'light');
const [{ data: widgetsData, refresh: refreshWidgets }, { data: currentUser }] = await Promise.all([
  useAsyncData('public-widgets', () => listPublicWidgets()),
  useAsyncData('current-user', () => getCurrentAdminUser()),
]);

const isLoggedIn = computed(() => currentUser.value != null);
const editorWidgets = ref<SiteWidget[] | null>(null);
const editorOverrides = ref<Record<string, Partial<SiteWidget>>>({});
const activeEditorWidgetId = ref<string | null>(null);
const widgetScale = ref(1);
const WIDGET_DESIGN_VIEWPORT_WIDTH = 2560;
const MAX_WIDGET_DESIGN_WIDTH = 620;

type DragSession = {
  id: string;
  pointerId: number;
  grabX: number;
  grabY: number;
  width: number;
  height: number;
};

const dragSession = ref<DragSession | null>(null);

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

function refreshWidgetPositions() {
  void refreshWidgets();
}

function refreshVisibleWidgetPositions() {
  if (document.visibilityState === 'visible') refreshWidgetPositions();
}

function updateResponsiveWidgetScale() {
  if (!import.meta.client) return;
  if (window.innerWidth < 768) {
    widgetScale.value = 0;
    return;
  }

  const content = document.querySelector<HTMLElement>('.content-column');
  const contentWidth = content?.getBoundingClientRect().width ?? 680;
  const sideSpace = Math.max(0, (window.innerWidth - contentWidth) / 2);
  const viewportScale = window.innerWidth / WIDGET_DESIGN_VIEWPORT_WIDTH;
  const safeAreaScale = Math.max(0.08, (sideSpace - 12) / MAX_WIDGET_DESIGN_WIDTH);
  widgetScale.value = Math.min(1, viewportScale, safeAreaScale);
}

function postEditorMessage(message: Record<string, unknown>) {
  if (!isWidgetEditor.value || !import.meta.client) return;
  window.parent.postMessage(message, '*');
}

function handleEditorMessage(event: MessageEvent) {
  if (!isWidgetEditor.value || event.source !== window.parent) return;
  const message = event.data as { type?: string; widgets?: unknown } | null;
  if (message?.type !== 'widget-editor-sync' || !Array.isArray(message.widgets)) return;

  editorWidgets.value = message.widgets as SiteWidget[];
  editorOverrides.value = {};
}

function getSafeHorizontalBounds() {
  const content = document.querySelector<HTMLElement>('.content-column');
  const rect = content?.getBoundingClientRect();
  if (rect) return { left: rect.left - 16, right: rect.right + 16 };
  return {
    left: (window.innerWidth - 680) / 2 - 16,
    right: (window.innerWidth + 680) / 2 + 16,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function placeEditorWidget(
  widget: SiteWidget,
  desiredLeft: number,
  desiredTop: number,
  width: number,
  height: number,
) {
  const scale = Math.max(widgetScale.value, 0.01);
  const safe = getSafeHorizontalBounds();
  const margin = 12;
  const centerX = desiredLeft + width / 2;
  const centerY = desiredTop + height / 2;
  const area: WidgetArea = centerX < window.innerWidth / 2 ? 'LEFT' : 'RIGHT';
  const verticalPosition: WidgetVerticalPosition =
    centerY < window.innerHeight / 2 ? 'TOP' : 'BOTTOM';

  const left = area === 'LEFT'
    ? clamp(desiredLeft, margin, safe.left - width)
    : clamp(desiredLeft, safe.right, window.innerWidth - width - margin);
  const top = clamp(desiredTop, margin, window.innerHeight - height - margin);
  const horizontalOffset = area === 'LEFT'
    ? left / scale
    : (window.innerWidth - left - width) / scale;
  const verticalOffset = verticalPosition === 'TOP'
    ? top / scale
    : (window.innerHeight - top - height) / scale;
  const payload = {
    area,
    verticalPosition,
    horizontalOffset: Math.round(horizontalOffset),
    verticalOffset: Math.round(verticalOffset),
  };

  editorOverrides.value = {
    ...editorOverrides.value,
    [widget.id]: { ...(editorOverrides.value[widget.id] ?? {}), ...payload },
  };
  return payload;
}

function handleWidgetPointerDown(event: PointerEvent, widget: SiteWidget) {
  if (!isWidgetEditor.value || window.innerWidth < 768 || event.button !== 0) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  event.preventDefault();
  target.setPointerCapture?.(event.pointerId);
  activeEditorWidgetId.value = widget.id;
  dragSession.value = {
    id: widget.id,
    pointerId: event.pointerId,
    grabX: event.clientX - rect.left,
    grabY: event.clientY - rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function handleWidgetPointerMove(event: PointerEvent) {
  const drag = dragSession.value;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const widget = widgets.value.find((item) => item.id === drag.id);
  if (!widget) return;
  event.preventDefault();
  const payload = placeEditorWidget(
    widget,
    event.clientX - drag.grabX,
    event.clientY - drag.grabY,
    drag.width,
    drag.height,
  );
  postEditorMessage({ type: 'widget-editor-change', id: widget.id, payload });
}

function finishWidgetDrag(event: PointerEvent) {
  const drag = dragSession.value;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const widget = widgets.value.find((item) => item.id === drag.id);
  const payload = editorOverrides.value[drag.id];
  dragSession.value = null;
  if (widget && payload) {
    postEditorMessage({ type: 'widget-editor-change', id: widget.id, payload });
  }
}

function handleWidgetKeydown(event: KeyboardEvent, widget: SiteWidget) {
  if (!isWidgetEditor.value || !event.key.startsWith('Arrow')) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const step = event.shiftKey ? 10 : 1;
  const deltaX = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
  const deltaY = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
  if (!deltaX && !deltaY) return;
  event.preventDefault();
  activeEditorWidgetId.value = widget.id;
  const payload = placeEditorWidget(
    widget,
    rect.left + deltaX,
    rect.top + deltaY,
    rect.width,
    rect.height,
  );
  postEditorMessage({ type: 'widget-editor-change', id: widget.id, payload });
}

onMounted(() => {
  const renderedTheme = document.documentElement.dataset.theme;
  if (renderedTheme === 'dark' || renderedTheme === 'light') {
    theme.value = renderedTheme;
  }
  window.addEventListener('focus', refreshWidgetPositions);
  window.addEventListener('resize', updateResponsiveWidgetScale);
  window.addEventListener('message', handleEditorMessage);
  window.addEventListener('pointermove', handleWidgetPointerMove, { passive: false });
  window.addEventListener('pointerup', finishWidgetDrag);
  window.addEventListener('pointercancel', finishWidgetDrag);
  document.addEventListener('visibilitychange', refreshVisibleWidgetPositions);
  nextTick(() => {
    updateResponsiveWidgetScale();
    postEditorMessage({ type: 'widget-editor-ready' });
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('focus', refreshWidgetPositions);
  window.removeEventListener('resize', updateResponsiveWidgetScale);
  window.removeEventListener('message', handleEditorMessage);
  window.removeEventListener('pointermove', handleWidgetPointerMove);
  window.removeEventListener('pointerup', finishWidgetDrag);
  window.removeEventListener('pointercancel', finishWidgetDrag);
  document.removeEventListener('visibilitychange', refreshVisibleWidgetPositions);
});

const { getStrategy } = useWidgetRegistry();

const widgets = computed(() => {
  const source = isWidgetEditor.value && editorWidgets.value
    ? editorWidgets.value
    : widgetsData.value ?? [];
  const all = source.map((widget) => ({
    ...widget,
    ...(editorOverrides.value[widget.id] ?? {}),
  }));
  if (isWidgetEditor.value) return all;
  if (isLoggedIn.value) return all;
  return all.filter((w) => !getStrategy(w.type).requiresAuth);
});

function getWidgetPosition(widget: SiteWidget) {
  const area: WidgetArea = widget.area === 'RIGHT' ? 'RIGHT' : 'LEFT';
  const verticalPosition: WidgetVerticalPosition =
    widget.verticalPosition === 'BOTTOM' ? 'BOTTOM' : 'TOP';
  const rawHorizontalOffset = Number(widget.horizontalOffset);
  const rawVerticalOffset = Number(widget.verticalOffset);
  const horizontalOffset = Number.isFinite(rawHorizontalOffset)
    ? Math.max(-1000, Math.min(3000, rawHorizontalOffset))
    : area === 'LEFT' ? 24 : 20;
  const verticalOffset = Number.isFinite(rawVerticalOffset)
    ? Math.max(-1000, Math.min(3000, rawVerticalOffset))
    : verticalPosition === 'TOP'
      ? area === 'RIGHT' ? 82 : 22
      : area === 'LEFT' ? 16 : 28;
  const scale = widgetScale.value || 1;

  return {
    '--widget-rotation': `${getWidgetRotation(widget)}deg`,
    '--widget-scale': String(scale),
    [area === 'LEFT' ? 'left' : 'right']: `${horizontalOffset * scale}px`,
    [verticalPosition === 'TOP' ? 'top' : 'bottom']: `${verticalOffset * scale}px`,
  };
}

function getWidgetAnchorClasses(widget: SiteWidget) {
  const area = widget.area === 'RIGHT' ? 'right' : 'left';
  const vertical = widget.verticalPosition === 'BOTTOM' ? 'bottom' : 'top';
  return [`widget-anchor-${area}-${vertical}`, {
    'widget-editor-item': isWidgetEditor.value,
    'widget-editor-active': activeEditorWidgetId.value === widget.id,
    'widget-editor-disabled': isWidgetEditor.value && !widget.enabled,
  }];
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

  <div v-if="isWidgetEditor" class="widget-editor-safe-zone" aria-hidden="true">
    <span>内容安全区</span>
  </div>

  <div v-if="isWidgetEditor" class="widget-editor-hint" aria-live="polite">
    拖动小工具调整位置 · 方向键微调 · Shift + 方向键移动 10px
  </div>

  <div
    v-for="widget in widgets"
    :key="widget.id"
    class="widget-positioned"
    :class="[`widget-type-${widget.type}`, getWidgetAnchorClasses(widget)]"
    :style="getWidgetPosition(widget)"
    :tabindex="isWidgetEditor ? 0 : undefined"
    :role="isWidgetEditor ? 'button' : undefined"
    :aria-label="isWidgetEditor ? `移动${widget.title || widget.type}` : undefined"
    @pointerdown="handleWidgetPointerDown($event, widget)"
    @pointerup="finishWidgetDrag($event)"
    @pointercancel="finishWidgetDrag($event)"
    @keydown="handleWidgetKeydown($event, widget)"
  >
      <div v-if="widget.type === 'PROJECT_TREE'" class="project-tree-widget flex flex-col gap-y-2 rounded-lg p-3">
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

.widget-positioned {
  position: fixed;
  z-index: 10;
  pointer-events: auto;
  transform: scale(var(--widget-scale, 1)) rotate(var(--widget-rotation, 0deg));
  transform-origin: center;
  will-change: transform;
}

.widget-anchor-left-top { transform-origin: top left; }
.widget-anchor-right-top { transform-origin: top right; }
.widget-anchor-left-bottom { transform-origin: bottom left; }
.widget-anchor-right-bottom { transform-origin: bottom right; }

.widget-editor-safe-zone {
  position: fixed;
  inset: 0 auto 0 50%;
  z-index: 8;
  width: min(712px, calc(100vw - 24px));
  border-inline: 1px dashed rgba(196, 84, 52, 0.45);
  background: rgba(196, 84, 52, 0.055);
  pointer-events: none;
  transform: translateX(-50%);
}

.widget-editor-safe-zone span {
  position: absolute;
  top: 10px;
  left: 50%;
  padding: 4px 9px;
  border: 1px solid rgba(196, 84, 52, 0.24);
  border-radius: 999px;
  background: rgba(255, 250, 242, 0.92);
  color: #9d452e;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  transform: translateX(-50%);
}

.widget-editor-hint {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 30;
  max-width: calc(100vw - 28px);
  padding: 7px 10px;
  border: 1px solid rgba(56, 71, 63, 0.15);
  border-radius: 7px;
  background: rgba(250, 248, 241, 0.92);
  box-shadow: 0 8px 30px rgba(42, 49, 45, 0.1);
  color: #59635e;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  backdrop-filter: blur(12px);
}

.widget-editor-item {
  cursor: grab;
  outline: 1px dashed rgba(48, 128, 102, 0.55);
  outline-offset: 5px;
  touch-action: none;
  user-select: none;
}

.widget-editor-item:active { cursor: grabbing; }

.widget-editor-item:focus-visible,
.widget-editor-active {
  outline: 2px solid #328066;
  outline-offset: 6px;
}

.widget-editor-item > * {
  pointer-events: none !important;
}

.widget-editor-disabled {
  opacity: .45;
}

.widget-type-DATE_CARD {
  width: 260px;
}

.widget-type-PHOTO_GALLERY {
  transform-origin: bottom right;
}

.project-tree-widget {
  font-family: Apfel Grotezk, system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  transform: scale(.8);
  transform-origin: top left;
}

.project-tree-widget .tree-item {
  min-height: 22.5px;
}

.keyboard-widget {
  margin-left: -44px;
  transform: scale(.75);
  transform-origin: bottom left;
}

@media (max-width: 767px) {
  .widget-positioned {
    display: none !important;
  }

  .widget-editor-hint::before {
    content: '当前宽度小于 768px，小工具已隐藏';
  }

  .widget-editor-hint {
    font-size: 0;
  }

  .widget-editor-hint::before {
    font-size: 10px;
  }
}
</style>
