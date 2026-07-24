<script setup lang="ts">
import { listPublicWidgets } from '~/entities/widget/api/widgetApi';
import { getCurrentAdminUser } from '~/entities/admin-user/api/authApi';
import Keyboard87 from '~/components/widgets/ui/Keyboard87.vue';
import StandaloneMusicPlayer from '~/components/widgets/ui/StandaloneMusicPlayer.vue';
import DateCardWidget from '~/components/widgets/ui/DateCardWidget.vue';
import PhotoGalleryWidget from '~/components/widgets/ui/PhotoGalleryWidget.vue';
import ProjectTreeWidget from '~/components/widgets/ui/ProjectTreeWidget.vue';
import ImageLightbox from '~/components/media/ImageLightbox.vue';
import WidgetRenderer from '~/components/widgets/WidgetRenderer.vue';
import { useWidgetRegistry } from '~/components/widgets/strategies/useWidgetRegistry';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';

const route = useRoute();
const isWidgetEditor = computed(() => route.query.widgetEditor === '1');
const theme = useState<'light' | 'dark'>('site-theme', () => 'light');
const { adminUrl } = getRequiredPublicRuntimeConfig();
const [{ data: widgetsData, refresh: refreshWidgets }, { data: currentUser }] = await Promise.all([
  useAsyncData('public-widgets', () => listPublicWidgets()),
  useAsyncData('current-user', () => getCurrentAdminUser()),
]);

const isLoggedIn = computed(() => currentUser.value != null);
const { getStrategy } = useWidgetRegistry();
const {
  finishWidgetDrag,
  getWidgetAnchorClasses,
  getWidgetPosition,
  handleWidgetKeydown,
  handleWidgetPointerDown,
  normalizeWidget,
  widgets,
} = useWidgetLayout({
  adminUrl,
  getStrategy,
  isLoggedIn,
  isWidgetEditor,
  refreshWidgets,
  widgetsData,
});

onMounted(() => {
  const renderedTheme = document.documentElement.dataset.theme;
  if (renderedTheme === 'dark' || renderedTheme === 'light') {
    theme.value = renderedTheme;
  }
});
</script>

<template>
  <div class="site-shell">
    <SiteHeader />
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
      <ProjectTreeWidget v-if="widget.type === 'PROJECT_TREE'" />
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
  padding: 76px 0 0;
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
    padding: 66px 12px 0;
  }
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
