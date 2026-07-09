<script setup lang="ts">
interface KeyDef {
  label: string;
  code: string;
  pair?: boolean;
  punct?: boolean;
}

const rows: KeyDef[][] = [
  [
    { label: 'Q', code: 'KeyQ' },
    { label: 'W', code: 'KeyW' },
    { label: 'E', code: 'KeyE' },
    { label: 'R', code: 'KeyR' },
    { label: 'T', code: 'KeyT' },
    { label: 'Y', code: 'KeyY' },
    { label: 'U', code: 'KeyU' },
    { label: 'I', code: 'KeyI' },
    { label: 'O', code: 'KeyO' },
    { label: 'P', code: 'KeyP' },
    { label: '[{', code: 'BracketLeft', pair: true },
    { label: '}]', code: 'BracketRight', pair: true },
  ],
  [
    { label: 'A', code: 'KeyA' },
    { label: 'S', code: 'KeyS' },
    { label: 'D', code: 'KeyD' },
    { label: 'F', code: 'KeyF' },
    { label: 'G', code: 'KeyG' },
    { label: 'H', code: 'KeyH' },
    { label: 'J', code: 'KeyJ' },
    { label: 'K', code: 'KeyK' },
    { label: 'L', code: 'KeyL' },
    { label: ';:', code: 'Semicolon', punct: true },
    { label: '\'"', code: 'Quote', punct: true },
  ],
  [
    { label: 'Z', code: 'KeyZ' },
    { label: 'X', code: 'KeyX' },
    { label: 'C', code: 'KeyC' },
    { label: 'V', code: 'KeyV' },
    { label: 'B', code: 'KeyB' },
    { label: 'N', code: 'KeyN' },
    { label: 'M', code: 'KeyM' },
    { label: ',<', code: 'Comma', punct: true },
    { label: '.>', code: 'Period', punct: true },
    { label: '/?', code: 'Slash', punct: true },
  ],
];

// 音频池
const POOL_SIZE = 8;

function createSoundPool(src: string, volume = 0.35): () => void {
  let pool: HTMLAudioElement[] | null = null;
  let index = 0;

  function getPool(): HTMLAudioElement[] {
    if (!pool) {
      pool = Array.from({ length: POOL_SIZE }, () => {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.preload = 'auto';
        return audio;
      });
    }
    return pool;
  }

  return () => {
    const p = getPool();
    const audio = p[index];
    audio.currentTime = 0;
    audio.play().catch(() => {});
    index = (index + 1) % p.length;
  };
}

const playPressSound = createSoundPool('/music/press_key.mp3');
const playReleaseSound = createSoundPool('/music/release_key.mp3', 0.25);

function isKey(target: EventTarget | null): boolean {
  return !!(target as HTMLElement).closest('.key');
}

function onKeyPointerDown(e: PointerEvent) {
  if (!isKey(e.target)) return;
  playPressSound();
}

function onKeyPointerUp(e: PointerEvent) {
  if (!isKey(e.target)) return;
  playReleaseSound();
}
</script>

<template>
  <div class="keyboard-outer">
    <div class="keyboard" @pointerdown="onKeyPointerDown" @pointerup="onKeyPointerUp" @pointercancel="onKeyPointerUp">
      <div v-for="(row, ri) in rows" :key="ri" class="row" :style="ri === 1 ? { marginLeft: '14px' } : {}">
        <button
          v-for="key in row"
          :key="key.code"
          class="key"
          :class="{ pair: key.pair, punct: key.punct }"
        >
          <span class="shell"></span>
          <span class="corner"></span>
          <span class="inner"><span class="legend">{{ key.label }}</span></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --page-top: #f8f9fa;
  --page-bottom: #f2f4f6;
  --dot-1: rgba(170, 181, 192, .34);
  --dot-2: rgba(170, 181, 192, .18);

  /* 改回参考图那种冷灰白键帽 */
  --ink: #3a4654;

  --body-top: #eceff1;
  --body-mid: #dde2e5;
  --body-bottom: #c5ccd1;

  --slope-top: #f3f5f6;
  --slope-left: #e6eaec;
  --slope-right: #d2d8dc;
  --slope-bottom: #bcc4c9;

  --face-top: #eef1f2;
  --face-mid: #dfe4e7;
  --face-bottom: #cfd5d9;
}

* { box-sizing: border-box; }

.keyboard-outer {
  display: inline-block;
  transform: rotate(-5.5deg);
  transform-origin: 30% 50%;
}

.keyboard {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px 2px;
  background: transparent;
  user-select: none;
}

.row {
  display: flex;
  gap: 5px;
}

.key {
  --size: 30px;
  --radius: 6px;

  position: relative;
  isolation: isolate;
  flex: 0 0 auto;

  width: var(--size);
  height: var(--size);

  border: 0;
  padding: 0;
  overflow: visible;
  background: transparent;

  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;

  transform: scale(1);
  transform-origin: center;
  transition:
    transform 120ms ease,
    filter 120ms ease;
}

/*
  主要悬浮阴影：明显、柔和、向前。
  让按键看起来像轻轻浮在底面上。
*/
.key::after {
  content: "";
  position: absolute;
  left: -1px;
  right: -1px;
  bottom: -8px;
  height: 13px;
  z-index: -1;
  border-radius: 50%;
  background:
    radial-gradient(
      ellipse at 50% 20%,
      rgba(89, 101, 110, .38) 0%,
      rgba(89, 101, 110, .24) 34%,
      rgba(89, 101, 110, .12) 60%,
      rgba(89, 101, 110, .04) 78%,
      rgba(89, 101, 110, 0) 100%
    );
  filter: blur(3px);
  transform:
    translateY(4px)
    scaleX(1.08)
    scaleY(.95);
  transform-origin: 50% 20%;
  opacity: .98;
  transition:
    transform 120ms ease,
    filter 120ms ease,
    opacity 120ms ease;
}

/*
  键帽本体：保留 Uiverse 的核心结构，
  但换成冷灰白配色。
*/
.shell {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--radius);

  background:
    linear-gradient(
      180deg,
      var(--body-top) 0%,
      var(--body-mid) 56%,
      var(--body-bottom) 100%
    );

  box-shadow:
    inset 0 1px 1px rgba(255,255,255,.72),
    inset 0 -3px 5px rgba(101,112,120,.10),
    0 1px 0 rgba(183,191,197,.96),
    0 2px 0 rgba(173,181,187,.96),
    0 3px 5px rgba(92,104,113,.12);
}

/*
  原 Uiverse 的关键结构：
  用四边 border 形成斜面。
*/
.shell::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: calc(var(--radius) * .8);

  border-top: 9px solid var(--slope-top);
  border-left: 8px solid var(--slope-left);
  border-right: 8px solid var(--slope-right);
  border-bottom: 10px solid var(--slope-bottom);

  filter: blur(1.25px);
}

.corner {
  position: absolute;
  inset: 0;
  opacity: .14;
  pointer-events: none;
}

.corner::before,
.corner::after {
  content: "";
  position: absolute;
  top: 0;

  border-top: 10px solid rgba(255,255,255,.95);
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;

  filter: blur(1.25px);
}

.corner::before {
  left: 2px;
  transform: rotate(-45deg);
}

.corner::after {
  right: 2px;
  transform: rotate(45deg);
  opacity: .46;
}

.inner {
  position: absolute;
  inset: 4px 3.5px;
  z-index: 2;

  display: grid;
  place-items: center;

  border-radius: calc(var(--radius) * .82);

  background:
    linear-gradient(
      180deg,
      var(--face-top) 0%,
      var(--face-mid) 52%,
      var(--face-bottom) 100%
    );

  box-shadow:
    inset 0 1px 1px rgba(255,255,255,.46),
    inset 0 -2px 3px rgba(97,109,117,.07),
    0 0 0 1px rgba(255,255,255,.16);
}

.inner::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: linear-gradient(145deg, rgb(224 161 161) 0%, transparent 36%);
  pointer-events: none;
}

.legend {
  position: relative;
  z-index: 3;
  color: var(--ink);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  transform: translateY(1px);
  text-shadow: 0 1px 0 rgba(255,255,255,.35);
}

.key.pair .legend,
.key.punct .legend {
  font-size: 10px;
  letter-spacing: -.5px;
}

/*
  不做 hover。
  只在 active 时变化：键帽缩小，阴影收紧。
*/
.key:active {
  transform: scale(.95);
}

.key:active::after {
  transform:
    translateY(2px)
    scaleX(.92)
    scaleY(.62);
  filter: blur(2px);
  opacity: .74;
}

.key:active .inner {
  box-shadow:
    inset 0 2px 3px rgba(98,110,118,.08),
    inset 0 -1px 1px rgba(255,255,255,.22),
    0 0 0 1px rgba(255,255,255,.10);
}

.key:active .corner {
  opacity: .06;
}
</style>
