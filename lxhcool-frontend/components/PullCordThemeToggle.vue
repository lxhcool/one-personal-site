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
      <span class="pull-switch__handle" aria-hidden="true" @animationend="finishPull" />
    </button>
  </div>
</template>

<style scoped>
.pull-switch {
  --switch-rope-dark: #51483d;
  --switch-rope-light: #8a7d6d;
  --switch-cap: #756858;
  --switch-wood-light: #b9834f;
  --switch-wood-mid: #8c5c31;
  --switch-wood-dark: #65401f;
  --switch-wood-border: rgba(69, 42, 20, 0.42);
  --switch-wood-shadow: rgba(61, 39, 20, 0.24);
  position: fixed;
  top: 0;
  right: 38px;
  z-index: 60;
  width: 38px;
  height: 122px;
  pointer-events: none;
}

.pull-switch.dark {
  --switch-rope-dark: #626d6c;
  --switch-rope-light: #899493;
  --switch-cap: #495453;
  --switch-wood-light: #90653e;
  --switch-wood-mid: #694625;
  --switch-wood-dark: #472d18;
  --switch-wood-border: rgba(27, 17, 9, 0.62);
  --switch-wood-shadow: rgba(0, 0, 0, 0.34);
}

.pull-switch__button {
  position: relative;
  display: block;
  width: 38px;
  height: 122px;
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
  outline: 1px dashed rgba(76, 117, 88, 0.72);
  outline-offset: -4px;
  border-radius: 0 0 8px 8px;
}

.pull-switch__fixture {
  position: absolute;
  top: -2px;
  left: 13px;
  width: 12px;
  height: 6px;
  border: 0;
  border-radius: 0 0 5px 5px;
  background: var(--switch-cap);
  box-shadow: 0 1px 3px rgba(48, 40, 31, 0.16);
}

.pull-switch__cord {
  position: absolute;
  top: 5px;
  left: 18px;
  width: 2px;
  height: 68px;
  border-radius: 2px;
  background: repeating-linear-gradient(
    135deg,
    var(--switch-rope-dark) 0 2px,
    var(--switch-rope-light) 2px 4px
  );
  box-shadow: 1px 0 rgba(255, 255, 255, 0.12);
  transform-origin: top;
  transform: translateZ(0) scaleY(1);
  will-change: transform;
}

.pull-switch__handle {
  position: absolute;
  top: 69px;
  left: 11px;
  width: 16px;
  height: 30px;
  border: 1px solid var(--switch-wood-border);
  border-radius: 7px 7px 9px 9px;
  background:
    linear-gradient(92deg, transparent 0 22%, rgba(74, 43, 19, 0.2) 24% 27%, transparent 29% 63%, rgba(255, 216, 161, 0.1) 65% 68%, transparent 70%),
    linear-gradient(90deg, var(--switch-wood-dark), var(--switch-wood-light) 46%, var(--switch-wood-mid) 70%, var(--switch-wood-dark));
  box-shadow:
    inset 1px 0 rgba(255, 225, 181, 0.14),
    inset -1px 0 rgba(54, 31, 14, 0.16),
    0 4px 8px var(--switch-wood-shadow);
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

.pull-switch__handle::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 6px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(45, 27, 13, 0.46);
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.22);
}

.pull-switch.pulling .pull-switch__cord {
  animation: cord-pull 520ms cubic-bezier(.22,.68,.3,1) both;
}

.pull-switch.pulling .pull-switch__handle {
  animation: handle-pull 520ms cubic-bezier(.22,.68,.3,1) both;
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
  background: rgba(5, 11, 14, 0.52);
  animation: switch-light 240ms ease-out both;
}

.flash-on {
  background: rgba(239, 229, 205, 0.46);
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
  0% { opacity: .34; }
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
