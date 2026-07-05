<script setup lang="ts">
import { requestPublicApi } from '~/shared/api/client';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';

const props = defineProps<{
  music: Record<string, unknown>;
  fallbackPhoto?: string;
}>();

const { apiBaseUrl } = getRequiredPublicRuntimeConfig();
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
  return `${apiBaseUrl}${url}`;
}
</script>

<template>
  <section class="moment-music-card">
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
      class="play-button"
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
  grid-template-columns: 58px minmax(0, 1fr) 36px;
  gap: 12px;
  align-items: center;
  max-width: 360px;
  padding: 10px;
  border-radius: 8px;
  background: #f7f8fa;
}

.music-cover {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: #e8edf5;
  color: #5570a7;
  font-weight: 700;
}

.music-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-main {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.music-main strong,
.music-main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-main span {
  color: var(--text-muted, #667085);
  font-size: 13px;
}

.play-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  color: #5570a7;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
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
</style>
