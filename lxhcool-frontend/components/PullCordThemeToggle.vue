<script setup lang="ts">
const theme = useState<'light' | 'dark'>('site-theme', () => 'light');
const isPulling = ref(false);
const flashMode = ref<'off' | 'on' | null>(null);
let paintFrame: number | undefined;
let themeFrame: number | undefined;

function applyTheme(nextTheme: 'light' | 'dark') {
  document.documentElement.dataset.theme = nextTheme;
  theme.value = nextTheme;
  try {
    window.localStorage.setItem('site-theme', nextTheme);
  } catch {
    // The theme still works when storage is unavailable.
  }
}

function pullCord() {
  if (isPulling.value) return;
  const nextTheme = theme.value === 'light' ? 'dark' : 'light';

  isPulling.value = true;

  // Give the cord one real painted frame before invalidating the whole theme.
  paintFrame = requestAnimationFrame(() => {
    themeFrame = requestAnimationFrame(() => {
      applyTheme(nextTheme);
      flashMode.value = nextTheme === 'dark' ? 'off' : 'on';
    });
  });
}

function finishPull() {
  isPulling.value = false;
}

function finishFlash() {
  flashMode.value = null;
}

onBeforeUnmount(() => {
  if (paintFrame !== undefined) cancelAnimationFrame(paintFrame);
  if (themeFrame !== undefined) cancelAnimationFrame(themeFrame);
});
</script>

<template>
  <div
    class="light-switch-flash"
    :class="flashMode ? `flash-${flashMode}` : undefined"
    aria-hidden="true"
    @animationend="finishFlash"
  />

  <div class="pull-switch" :class="{ pulling: isPulling, dark: theme === 'dark' }">
    <button
      type="button"
      class="pull-switch__button"
      :aria-label="theme === 'light' ? '拉绳关灯，切换到黑夜主题' : '拉绳开灯，切换到白天主题'"
      :title="theme === 'light' ? '拉一下，关灯' : '拉一下，开灯'"
      @pointerdown.prevent="pullCord"
      @keydown.enter.prevent="pullCord"
      @keydown.space.prevent="pullCord"
    >
      <span class="pull-switch__fixture" aria-hidden="true" />
      <span class="pull-switch__cord" aria-hidden="true" />
      <span class="pull-switch__handle" aria-hidden="true" @animationend="finishPull">
        <span />
      </span>
    </button>
  </div>
</template>

<style scoped>
.pull-switch {
  position: fixed;
  top: 0;
  right: 38px;
  z-index: 60;
  width: 42px;
  height: 116px;
  pointer-events: none;
}

.pull-switch__button {
  position: relative;
  display: block;
  width: 42px;
  height: 116px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: grab;
  pointer-events: auto;
}

.pull-switch__button:active {
  cursor: grabbing;
}

.pull-switch__button:focus-visible {
  outline: 2px solid rgba(118, 91, 47, 0.42);
  outline-offset: -5px;
  border-radius: 0 0 16px 16px;
}

.pull-switch__fixture {
  position: absolute;
  top: -2px;
  left: 7px;
  width: 28px;
  height: 11px;
  border: 1px solid rgba(91, 65, 28, 0.34);
  border-radius: 0 0 8px 8px;
  background: linear-gradient(90deg, #8c6a36, #d0aa61 48%, #80602f);
  box-shadow: inset 0 -2px 3px rgba(72, 49, 19, 0.25), 0 2px 4px rgba(72, 49, 19, 0.13);
}

.pull-switch__cord {
  position: absolute;
  top: 8px;
  left: 20px;
  width: 2px;
  height: 62px;
  border-radius: 2px;
  background: linear-gradient(90deg, #6d5330, #b89155 55%, #594224);
  box-shadow: 1px 0 1px rgba(255, 244, 209, 0.25);
  transform-origin: top;
  transform: translateZ(0) scaleY(1);
  will-change: transform;
}

.pull-switch__handle {
  position: absolute;
  top: 66px;
  left: 14px;
  display: grid;
  width: 14px;
  height: 24px;
  place-items: center;
  border: 1px solid rgba(72, 50, 24, 0.38);
  border-radius: 8px 8px 10px 10px;
  background: linear-gradient(90deg, #79542d, #b78042 46%, #6d4725);
  box-shadow: inset 2px 0 rgba(255, 225, 169, 0.12), 2px 4px 7px rgba(53, 38, 20, 0.2);
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

.pull-switch__handle span {
  width: 4px;
  height: 9px;
  border-radius: 4px;
  background: rgba(54, 37, 20, 0.32);
  box-shadow: 1px 0 rgba(255, 222, 159, 0.13);
}

.pull-switch.pulling .pull-switch__cord {
  animation: cord-pull 520ms cubic-bezier(.22,.68,.3,1) both;
}

.pull-switch.pulling .pull-switch__handle {
  animation: handle-pull 520ms cubic-bezier(.22,.68,.3,1) both;
}

.pull-switch.dark .pull-switch__fixture,
.pull-switch.dark .pull-switch__handle {
  filter: brightness(0.72) saturate(0.72);
}

.light-switch-flash {
  position: fixed;
  inset: 0;
  z-index: 55;
  pointer-events: none;
  opacity: 0;
  transform: translateZ(0);
  will-change: opacity;
  contain: strict;
}

.flash-off {
  background: radial-gradient(circle at 70% 8%, rgba(20, 30, 34, 0.36), rgba(4, 9, 12, 0.88));
  animation: switch-light 240ms ease-out both;
}

.flash-on {
  background: radial-gradient(circle at 68% 8%, rgba(255, 239, 194, 0.96), rgba(244, 226, 188, 0.82) 38%, rgba(237, 222, 196, 0.56));
  animation: switch-light 240ms ease-out both;
}

@keyframes cord-pull {
  0% { transform: translateZ(0) scaleY(1); }
  44% { transform: translateZ(0) scaleY(1.39); }
  68% { transform: translateZ(0) scaleY(1.31); }
  100% { transform: translateZ(0) scaleY(1); }
}

@keyframes handle-pull {
  0% { transform: translate3d(0, 0, 0) scaleY(1); }
  44% { transform: translate3d(0, 24px, 0) scaleY(1.04); }
  68% { transform: translate3d(0, 19px, 0) scaleY(1.02); }
  100% { transform: translate3d(0, 0, 0) scaleY(1); }
}

@keyframes switch-light {
  0% { opacity: .48; }
  100% { opacity: 0; }
}

@media (max-width: 680px) {
  .pull-switch { right: 12px; transform: scale(.86); transform-origin: top right; }
}

@media (prefers-reduced-motion: reduce) {
  .pull-switch.pulling .pull-switch__cord,
  .pull-switch.pulling .pull-switch__handle,
  .light-switch-flash {
    animation-duration: 1ms;
  }
}
</style>
