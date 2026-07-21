<script setup lang="ts">
import { requestPublicApi } from '~/shared/api/client';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';

const props = defineProps<{
  music: Record<string, unknown>;
  fallbackPhoto?: string;
}>();

const { publicApiBaseUrl } = getRequiredPublicRuntimeConfig();
const audioRef = ref<HTMLAudioElement | null>(null);
const activeEmbedUrl = ref('');
const isPlaying = ref(false);

const title = computed(() => readString('title') || '音乐');
const artist = computed(() => readString('artist') || '未知歌手');
const audioUrl = computed(() => resolveAssetUrl(readString('audioUrl')));
const embedUrl = computed(() => readString('embedUrl'));
const externalUrl = computed(() => readString('externalUrl'));
const metadataUrl = computed(() => externalUrl.value || embedUrl.value);
const { data: neteaseMetadata } = useAsyncData(
  `moment-music-metadata-${trackIdSeed()}`,
  () =>
    metadataUrl.value
      ? requestPublicApi<{ cover: string }>(
          `/public/music/netease/metadata?url=${encodeURIComponent(metadataUrl.value)}`,
        ).catch(() => ({ cover: '' }))
      : Promise.resolve({ cover: '' }),
  { watch: [metadataUrl] },
);
const coverUrl = computed(
  () =>
    resolveAssetUrl(readString('cover')) ??
    resolveAssetUrl(readString('coverUrl')) ??
    resolveAssetUrl(neteaseMetadata.value?.cover) ??
    resolveAssetUrl(props.fallbackPhoto),
);

watch(isPlaying, async (playing) => {
  if (audioUrl.value && audioRef.value) {
    activeEmbedUrl.value = '';
    if (playing) {
      await audioRef.value.play();
    } else {
      audioRef.value.pause();
    }
    return;
  }

  activeEmbedUrl.value = playing && embedUrl.value ? withAutoplay(embedUrl.value) : '';
});

function togglePlay() {
  isPlaying.value = !isPlaying.value;
}

function readString(key: string) {
  const value = props.music[key];
  return typeof value === 'string' ? value : '';
}

function trackIdSeed() {
  return readString('audioUrl') || readString('embedUrl') || readString('externalUrl') || readString('title');
}

function withAutoplay(url: string) {
  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set('auto', '1');
    return nextUrl.toString();
  } catch {
    return url.replace(/([?&])auto=0/, '$1auto=1');
  }
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  return `${publicApiBaseUrl}${url}`;
}
</script>

<template>
  <section class="moment-music-card" :class="{ 'is-playing': isPlaying }">
    <div class="music-cover">
      <img v-if="coverUrl" :src="coverUrl" alt="" />
      <span v-else>M</span>
    </div>

    <div class="music-main">
      <strong>{{ title }}</strong>
      <span>{{ artist }}</span>
    </div>

    <button
      type="button"
      class="play-button u-shadow-control"
      :aria-label="isPlaying ? '暂停音乐' : '播放音乐'"
      @click="togglePlay"
    >
      <span v-if="isPlaying">Ⅱ</span>
      <span v-else>▶</span>
    </button>

    <audio
      v-if="audioUrl"
      ref="audioRef"
      :src="audioUrl"
      preload="metadata"
      @ended="isPlaying = false"
    />
    <iframe
      v-if="activeEmbedUrl"
      class="hidden-player"
      :src="activeEmbedUrl"
      title="Music player"
      frameborder="0"
      allow="autoplay"
    />
  </section>
</template>

<style scoped>
.moment-music-card {
  position: relative;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) 34px;
  gap: 11px;
  align-items: center;
  width: 360px;
  max-width: 360px;
  padding: 11px 12px;
  border: 1px solid rgba(91, 100, 104, 0.2);
  border-radius: 7px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.36), transparent 38%),
    linear-gradient(180deg, rgba(230, 232, 229, 0.92), rgba(204, 209, 207, 0.9));
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.65),
    inset 0 -2px 4px rgba(83, 93, 98, 0.08),
    0 2px 0 rgba(164, 170, 168, 0.72),
    4px 7px 13px rgba(73, 82, 86, 0.11);
  transform: rotate(-0.35deg);
  transform-origin: 22% 50%;
}

.moment-music-card::before,
.moment-music-card::after {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #9ca3a1;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.55);
  content: '';
  opacity: 0.65;
}

.moment-music-card::before {
  top: 5px;
  left: 5px;
}

.moment-music-card::after {
  right: 5px;
  bottom: 5px;
}

.music-cover {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  overflow: hidden;
  border: 2px solid rgba(239, 241, 237, 0.82);
  border-radius: 5px;
  background: #c9cfcd;
  box-shadow:
    2px 3px 0 rgba(135, 143, 142, 0.62),
    3px 5px 8px rgba(67, 77, 81, 0.13),
    inset 0 0 0 1px rgba(66, 76, 80, 0.12);
  color: #667177;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
}

.music-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-main {
  position: relative;
  display: grid;
  gap: 3px;
  min-width: 0;
  padding-left: 10px;
}

.music-main::before {
  position: absolute;
  top: 5px;
  left: 0;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #8d9895;
  box-shadow: 0 0 0 2px rgba(91, 106, 99, 0.08);
  content: '';
}

.is-playing .music-main::before {
  background: #4e9b76;
  box-shadow: 0 0 0 2px rgba(78, 155, 118, 0.12), 0 0 7px rgba(78, 155, 118, 0.35);
}

.music-main strong,
.music-main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-main span {
  color: #778187;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
}

.music-main strong {
  color: #465159;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.play-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(92, 102, 107, 0.22);
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(247, 248, 246, 0.9), rgba(208, 213, 211, 0.94));
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.7),
    0 2px 0 rgba(151, 159, 157, 0.75),
    0 5px 8px rgba(72, 82, 87, 0.12);
  color: #5d686e;
  cursor: pointer;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  line-height: 1;
  transition: color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
}

.play-button:hover {
  color: #39454b;
}

.play-button:active {
  box-shadow:
    inset 0 2px 3px rgba(83, 94, 99, 0.12),
    0 1px 0 rgba(151, 159, 157, 0.68);
  transform: translateY(2px) scale(0.97);
}

.play-button:focus-visible {
  outline: 2px solid rgba(78, 155, 118, 0.32);
  outline-offset: 3px;
}

.hidden-player,
audio {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 420px) {
  .moment-music-card {
    grid-template-columns: 48px minmax(0, 1fr) 32px;
    gap: 9px;
    width: 100%;
    padding: 9px 10px;
  }

  .music-cover {
    width: 48px;
    height: 48px;
  }

  .play-button {
    width: 32px;
    height: 32px;
  }
}

/* Quiet desk-widget treatment: translucent like the calendar and unobtrusive player. */
.moment-music-card {
  grid-template-columns: 52px minmax(0, 1fr) 32px;
  gap: 11px;
  width: 360px;
  max-width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgb(255 255 255 / 8%);
  box-shadow:
    0 6px 14px rgba(82, 66, 45, 0.045),
    inset 0 1px 0 rgba(255, 250, 238, 0.3);
  backdrop-filter: blur(12px);
  transform: none;
}

.moment-music-card::before,
.moment-music-card::after,
.music-main::before {
  display: none;
}

.music-cover {
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 5px;
  background: rgba(178, 185, 184, 0.42);
  box-shadow: 0 2px 6px rgba(67, 77, 81, 0.08);
  color: #6d777c;
}

.music-main {
  gap: 3px;
  padding-left: 0;
}

.music-main strong {
  color: #4b565d;
  font-size: 12px;
  font-weight: 700;
}

.music-main span {
  color: #7c858a;
  font-size: 9px;
}

.play-button {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(78, 87, 91, 0.12);
  border-radius: 5px;
  background: rgba(78, 87, 91, 0.055);
  box-shadow: none;
  color: #687277;
  font-size: 10px;
}

.play-button:hover {
  background: rgba(78, 87, 91, 0.1);
  color: #4f5a60;
}

.play-button:active {
  box-shadow: none;
  transform: scale(0.96);
}

@media (max-width: 420px) {
  .moment-music-card {
    grid-template-columns: 48px minmax(0, 1fr) 30px;
    width: 100%;
    padding: 8px 9px;
  }

  .music-cover {
    width: 48px;
    height: 48px;
  }

  .play-button {
    width: 30px;
    height: 30px;
  }
}
</style>
