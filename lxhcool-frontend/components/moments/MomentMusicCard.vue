<script setup lang="ts">
import { ExternalLink } from '@lucide/vue';
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

const audioUrl = computed(() => resolveAssetUrl(readString('audioUrl')));
const embedUrl = computed(() => readString('embedUrl'));
const externalUrl = computed(() => readString('externalUrl'));
const metadataUrl = computed(() => externalUrl.value || embedUrl.value);
const sourceLabel = computed(() => readString('source').trim().toUpperCase() || 'AUDIO');

const { data: neteaseMetadata } = useAsyncData(
  `moment-music-metadata-${trackIdSeed()}`,
  () =>
    metadataUrl.value
      ? requestPublicApi<{ title: string; artist: string; cover: string }>(
          `/public/music/netease/metadata?url=${encodeURIComponent(metadataUrl.value)}`,
        ).catch(() => ({ title: '', artist: '', cover: '' }))
      : Promise.resolve({ title: '', artist: '', cover: '' }),
  { watch: [metadataUrl] },
);

const title = computed(() => readString('title') || neteaseMetadata.value?.title || '音乐');
const artist = computed(() => readString('artist') || neteaseMetadata.value?.artist || '网易云音乐');
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
  <section
    class="moment-music-card"
    :class="{ 'is-playing': isPlaying }"
    :aria-label="`音乐：${title}，${artist}`"
  >
    <div class="music-cover" aria-hidden="true">
      <img v-if="coverUrl" :src="coverUrl" alt="" />
      <span v-else>{{ title.slice(0, 1) }}</span>
    </div>

    <div class="music-main">
      <div class="music-kicker">
        <span class="equalizer" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>{{ sourceLabel }} AUDIO</span>
      </div>

      <strong :title="title">{{ title }}</strong>
      <span class="music-artist" :title="artist">{{ artist }}</span>
    </div>

    <div class="music-actions">
      <a
        v-if="externalUrl"
        class="source-link"
        :href="externalUrl"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="在音乐平台打开"
        title="在音乐平台打开"
      >
        <ExternalLink :size="13" :stroke-width="1.8" />
      </a>

      <button
        type="button"
        class="play-button"
        :aria-label="isPlaying ? '暂停音乐' : '播放音乐'"
        @click="togglePlay"
      >
        <svg class="playback-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path
            v-if="isPlaying"
            d="M5.5 4.25v7.5M10.5 4.25v7.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.65"
            stroke-linecap="round"
          />
          <path
            v-else
            d="M6.2 4.3c0-.52.58-.83 1.01-.54l5.16 3.58a.8.8 0 0 1 0 1.32l-5.16 3.58a.65.65 0 0 1-1.01-.54V4.3Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>

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
  grid-template-columns: 46px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 312px;
  max-width: 100%;
  min-height: 60px;
  padding: 7px;
  overflow: hidden;
  border: 0;
  border-radius: 7px;
  background: #f0f2f4;
  box-shadow: none;
  transition:
    background 160ms ease,
    transform 160ms ease;
}

.moment-music-card::after {
  content: none;
}

.moment-music-card:hover {
  background: #eaedef;
}

.music-cover {
  position: relative;
  z-index: 1;
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  overflow: hidden;
  border-radius: 5px;
  background: #dfe7e2;
  box-shadow:
    0 3px 8px rgba(38, 51, 44, 0.09),
    0 1px 2px rgba(38, 51, 44, 0.08);
  color: #698075;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
}

.music-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-main {
  position: relative;
  z-index: 1;
  display: grid;
  min-width: 0;
}

.music-kicker {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 3px;
  color: #6f8378;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 6.5px;
  font-weight: 600;
  letter-spacing: 0.11em;
  line-height: 1;
}

.equalizer {
  display: flex;
  align-items: end;
  gap: 1.5px;
  width: 11px;
  height: 8px;
}

.equalizer i {
  display: block;
  width: 1.5px;
  height: 3px;
  border-radius: 1px;
  background: #78a58d;
  transform-origin: bottom;
}

.equalizer i:nth-child(2) {
  height: 7px;
}

.equalizer i:nth-child(3) {
  height: 5px;
}

.equalizer i:nth-child(4) {
  height: 2px;
}

.is-playing .equalizer i {
  animation: equalizer-pulse 680ms ease-in-out infinite alternate;
  background: #438564;
}

.is-playing .equalizer i:nth-child(2) {
  animation-delay: -420ms;
}

.is-playing .equalizer i:nth-child(3) {
  animation-delay: -180ms;
}

.is-playing .equalizer i:nth-child(4) {
  animation-delay: -540ms;
}

.music-main strong,
.music-artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-main strong {
  color: #35443c;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.35;
}

.music-artist {
  margin-top: 2px;
  color: #7d8983;
  font-size: 8.5px;
  line-height: 1.25;
}

.music-actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 3px;
}

.source-link,
.play-button {
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
  transition:
    color 130ms ease,
    background 130ms ease,
    border-color 130ms ease,
    transform 130ms ease;
}

.source-link {
  width: 19px;
  height: 19px;
  border-radius: 50%;
  color: #8c9992;
}

.source-link:hover {
  background: rgba(57, 79, 68, 0.06);
  color: #4e6257;
}

.play-button {
  width: 23px;
  height: 23px;
  border: 0;
  border-radius: 50%;
  background: rgba(65, 80, 72, 0.075);
  box-shadow: none;
  color: #496f5b;
}

.playback-icon {
  display: block;
  width: 11px;
  height: 11px;
  overflow: visible;
}

.play-button:hover {
  background: rgba(73, 111, 91, 0.2);
  color: #345944;
  transform: scale(1.04);
}

.play-button:active {
  transform: scale(0.95);
}

.source-link:focus-visible,
.play-button:focus-visible {
  outline: 2px solid rgba(77, 154, 117, 0.34);
  outline-offset: 3px;
}

.is-playing .play-button {
  background: #496f5b;
  box-shadow: none;
  color: #fff;
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

:global(:root[data-theme='dark']) .moment-music-card {
  background: #26322d;
  box-shadow: none;
}

:global(:root[data-theme='dark']) .music-main strong {
  color: #dce5e0;
}

:global(:root[data-theme='dark']) .music-artist {
  color: #91a099;
}

:global(:root[data-theme='dark']) .music-kicker {
  color: #84a393;
}

:global(:root[data-theme='dark']) .source-link {
  color: #8fa198;
}

@keyframes equalizer-pulse {
  from {
    transform: scaleY(0.42);
  }
  to {
    transform: scaleY(1);
  }
}

@media (max-width: 420px) {
  .moment-music-card {
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 9px;
    width: 280px;
    min-height: 58px;
    padding: 7px;
  }

  .music-cover {
    width: 44px;
    height: 44px;
  }

  .source-link {
    display: none;
  }

  .play-button {
    width: 23px;
    height: 23px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .moment-music-card,
  .source-link,
  .play-button {
    transition: none;
  }

  .is-playing .equalizer i {
    animation: none;
  }
}
</style>
