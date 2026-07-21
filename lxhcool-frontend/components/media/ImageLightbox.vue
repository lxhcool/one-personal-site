<script setup lang="ts">
import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from '@lucide/vue';

const { state, current, close, previous, next } = useImagePreview();
const dialog = ref<HTMLElement>();
const scale = ref(1);
let previousOverflow = '';
let previousFocus: HTMLElement | null = null;

const hasMultiple = computed(() => state.value.images.length > 1);

function setScale(nextScale: number) {
  scale.value = Math.min(3, Math.max(1, Number(nextScale.toFixed(2))));
}

function onWheel(event: WheelEvent) {
  setScale(scale.value + (event.deltaY < 0 ? 0.2 : -0.2));
}

function onKeydown(event: KeyboardEvent) {
  if (!state.value.open) return;
  if (event.key === 'Escape') close();
  if (event.key === 'ArrowLeft') previous();
  if (event.key === 'ArrowRight') next();
  if (event.key === '+' || event.key === '=') setScale(scale.value + 0.2);
  if (event.key === '-') setScale(scale.value - 0.2);
}

watch(
  () => state.value.open,
  async (open) => {
    if (!import.meta.client) return;
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      await nextTick();
      dialog.value?.focus();
      return;
    }

    document.body.style.overflow = previousOverflow;
    previousFocus?.focus();
  },
);

watch(
  () => state.value.index,
  () => {
    scale.value = 1;
    if (!import.meta.client || !state.value.open || state.value.images.length < 2) return;
    const adjacent = [
      state.value.images[(state.value.index - 1 + state.value.images.length) % state.value.images.length],
      state.value.images[(state.value.index + 1) % state.value.images.length],
    ];
    adjacent.forEach((image) => {
      const preload = new Image();
      preload.src = image.src;
    });
  },
);

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <Teleport to="body">
    <Transition name="image-lightbox">
      <section
        v-if="state.open && current"
        ref="dialog"
        class="image-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="图片预览"
        tabindex="-1"
        @click.self="close"
        @wheel.prevent="onWheel"
      >
        <header class="image-lightbox__bar">
          <span>{{ String(state.index + 1).padStart(2, '0') }} / {{ String(state.images.length).padStart(2, '0') }}</span>
          <div class="image-lightbox__tools">
            <button type="button" aria-label="缩小图片" :disabled="scale <= 1" @click="setScale(scale - 0.2)"><ZoomOut :size="17" /></button>
            <button type="button" aria-label="恢复图片大小" :disabled="scale === 1" @click="setScale(1)"><RotateCcw :size="16" /></button>
            <button type="button" aria-label="放大图片" :disabled="scale >= 3" @click="setScale(scale + 0.2)"><ZoomIn :size="17" /></button>
            <button type="button" aria-label="关闭图片预览" @click="close"><X :size="19" /></button>
          </div>
        </header>

        <button v-if="hasMultiple" type="button" class="image-lightbox__nav image-lightbox__nav--previous" aria-label="上一张图片" @click="previous">
          <ChevronLeft :size="25" />
        </button>

        <div class="image-lightbox__viewport">
          <figure :style="{ '--preview-scale': scale }">
            <img
              :src="current.src"
              :alt="current.alt || current.caption || ''"
              draggable="false"
              @dblclick="setScale(scale === 1 ? 2 : 1)"
            />
            <figcaption v-if="current.caption">{{ current.caption }}</figcaption>
          </figure>
        </div>

        <button v-if="hasMultiple" type="button" class="image-lightbox__nav image-lightbox__nav--next" aria-label="下一张图片" @click="next">
          <ChevronRight :size="25" />
        </button>
      </section>
    </Transition>
  </Teleport>
</template>

<style scoped>
.image-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 18px;
  background: rgba(10, 14, 16, 0.91);
  backdrop-filter: blur(9px);
  color: #d8dddb;
  outline: none;
}

.image-lightbox__bar {
  display: flex;
  z-index: 2;
  align-items: center;
  justify-content: space-between;
  color: #93a09f;
  font-family: 'lxhcool-mono', ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: .08em;
}

.image-lightbox__tools {
  display: flex;
  gap: 5px;
}

.image-lightbox__tools button,
.image-lightbox__nav {
  display: grid;
  place-items: center;
  border: 1px solid rgba(190, 202, 202, 0.18);
  background: rgba(236, 231, 220, 0.07);
  color: #c1cac9;
  cursor: pointer;
}

.image-lightbox__tools button {
  width: 32px;
  height: 32px;
  border-radius: 5px;
}

.image-lightbox__tools button:hover:not(:disabled),
.image-lightbox__nav:hover {
  border-color: rgba(116, 174, 143, 0.4);
  background: rgba(73, 129, 99, 0.15);
  color: #91c7aa;
}

.image-lightbox__tools button:disabled {
  opacity: .28;
  cursor: default;
}

.image-lightbox__viewport {
  display: grid;
  min-height: 0;
  overflow: auto;
  place-items: center;
  padding: 18px 62px 28px;
}

.image-lightbox figure {
  display: grid;
  max-width: 100%;
  gap: 12px;
  margin: 0;
  place-items: center;
}

.image-lightbox figure img {
  display: block;
  width: auto;
  max-width: min(88vw, 1440px);
  height: auto;
  max-height: 82vh;
  border-radius: 5px;
  box-shadow: 0 22px 72px rgba(0, 0, 0, 0.46);
  object-fit: contain;
  transform: scale(var(--preview-scale));
  transform-origin: center;
  transition: transform 130ms ease;
  user-select: none;
}

.image-lightbox figcaption {
  max-width: 760px;
  color: #9ca7a6;
  font-size: 12px;
  line-height: 1.55;
  text-align: center;
}

.image-lightbox__nav {
  position: fixed;
  top: 50%;
  z-index: 3;
  width: 42px;
  height: 54px;
  border-radius: 6px;
  transform: translateY(-50%);
}

.image-lightbox__nav--previous { left: 20px; }
.image-lightbox__nav--next { right: 20px; }

.image-lightbox-enter-active,
.image-lightbox-leave-active { transition: opacity 170ms ease; }
.image-lightbox-enter-from,
.image-lightbox-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .image-lightbox { padding: 10px; }
  .image-lightbox__viewport { padding: 14px 40px 20px; }
  .image-lightbox__nav { width: 34px; height: 46px; }
  .image-lightbox__nav--previous { left: 7px; }
  .image-lightbox__nav--next { right: 7px; }
}

@media (prefers-reduced-motion: reduce) {
  .image-lightbox-enter-active,
  .image-lightbox-leave-active,
  .image-lightbox figure img { transition: none; }
}
</style>
