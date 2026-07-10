<script setup lang="ts">
import { ListMusic, Pause, Play, RefreshCw, SkipBack, SkipForward, X } from '@lucide/vue';
import { listPublicFriendLinks } from '~/entities/friend-link/api/friendLinkApi';
import type { SiteWidget } from '~/entities/widget/model/types';
import ProjectTreeWidget from './ui/ProjectTreeWidget.vue';
import DateCardWidget from './ui/DateCardWidget.vue';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';
import { requestPublicApi } from '~/shared/api/client';
import { readArray, readBoolean, readNumber, readString } from '~/shared/widgets/lib/config';

const props = defineProps<{
  widget: SiteWidget;
}>();

const { apiBaseUrl } = getRequiredPublicRuntimeConfig();
const audioRef = ref<HTMLAudioElement | null>(null);
const activeEmbedUrl = ref('');
const isPlaying = ref(false);
const isPlaylistOpen = ref(false);
const playlistIndex = ref(0);
const progressRatio = ref(0);
const currentTimeLabel = ref('0:00');
const durationLabel = ref('0:00');
const simulatedCurrentTime = ref(0);
let progressTimer: ReturnType<typeof setInterval> | undefined;

type HitokotoSentence = {
  hitokoto: string;
  from?: string | null;
  from_who?: string | null;
};

type ProfileSocial = {
  platform: string;
  label: string;
  url: string;
  icon?: string;
  color?: string;
  qrCode?: string;
};

const socialDefaultColors: Record<string, string> = {
  github: '181717',
  gitee: 'C71D23',
  douyin: '000000',
  tiktok: '000000',
  xiaohongshu: 'FF2442',
  bilibili: '00A1D6',
  'netease-cloud-music': 'D43C33',
  neteasecloudmusic: 'D43C33',
  zhihu: '0084FF',
  juejin: '1E80FF',
  csdn: 'FC5531',
  weibo: 'E6162D',
  sinaweibo: 'E6162D',
  telegram: '26A5E4',
  discord: '5865F2',
  instagram: 'E4405F',
  youtube: 'FF0000',
  x: '000000',
  wechat: '07C160',
  qq: '1EBAFC',
  tencentqq: '1EBAFC',
};

const config = computed(() => props.widget.config ?? {});

const normalized = computed(() => {
  switch (props.widget.type) {
    case 'MUSIC_PLAYER':
      return {
        defaultTitle: readString(config.value, 'defaultTitle'),
        defaultArtist: readString(config.value, 'defaultArtist'),
        cover: resolveAssetUrl(readString(config.value, 'cover') || readString(config.value, 'coverUrl')),
        playlist: readArray<Record<string, unknown>>(config.value, 'playlist'),
        playlistSource: readObject(config.value, 'playlistSource'),
      };
    case 'HITOKOTO':
      return {
        text: readString(config.value, 'text', '\u613f\u4f60\u6709\u524d\u8fdb\u4e00\u6b65\u7684\u52c7\u6c14\u3002'),
        from: readString(config.value, 'from'),
        category: readString(config.value, 'category'),
        categories: readArray<string>(config.value, 'categories'),
      };
    case 'FRIEND_LINKS':
      return {
        category: readString(config.value, 'category'),
        limit: readNumber(config.value, 'limit', 6),
        random: readBoolean(config.value, 'random'),
      };
    case 'PROFILE':
      return {
        coverImage: resolveAssetUrl(readString(config.value, 'coverImage')),
        avatar: resolveAssetUrl(readString(config.value, 'avatar')),
        name: readString(config.value, 'name'),
        role: readString(config.value, 'role'),
        bio: readString(config.value, 'bio'),
        socials: readArray<ProfileSocial>(config.value, 'socials'),
        stats: readArray<{ label: string; value: string }>(config.value, 'stats'),
      };
    case 'DATE_CARD':
      return {
        showTime: readBoolean(config.value, 'showTime', true),
        siteStartDate: readString(config.value, 'siteStartDate'),
      };
    case 'PHOTO_GALLERY':
      return {
        images: readArray<{ url: string; alt?: string; caption?: string }>(config.value, 'images'),
      };
    case 'PROJECT_TREE':
      return {
        maxDepth: readNumber(config.value, 'maxDepth', 2),
      };
    default:
      return {};
  }
});

const hitokotoCategories = computed(() => {
  if (props.widget.type !== 'HITOKOTO') return [];
  const hitokotoConfig = normalized.value as {
    category?: string;
    categories?: string[];
  };
  const categories = [
    hitokotoConfig.category,
    ...(Array.isArray(hitokotoConfig.categories) ? hitokotoConfig.categories : []),
  ];
  return [...new Set(categories.filter((item): item is string => Boolean(item)))];
});

const hitokotoQuery = computed(() =>
  hitokotoCategories.value.length > 0 ? { c: hitokotoCategories.value } : undefined,
);

const { data: remoteHitokoto, pending: isHitokotoPending, refresh: refreshHitokoto } = useAsyncData(
  `widget-hitokoto-${props.widget.id}`,
  () =>
    props.widget.type === 'HITOKOTO'
      ? $fetch<HitokotoSentence>('https://v1.hitokoto.cn/', {
          query: hitokotoQuery.value,
          timeout: 5000,
        }).catch(() => null)
      : Promise.resolve(null),
  { server: false, watch: [hitokotoQuery] },
);

const hitokotoText = computed(() => {
  if (props.widget.type !== 'HITOKOTO') return '';
  const fallback = normalized.value as { text?: string };
  return remoteHitokoto.value?.hitokoto || fallback.text || '\u613f\u4f60\u6709\u524d\u8fdb\u4e00\u6b65\u7684\u52c7\u6c14\u3002';
});

const hitokotoSource = computed(() => {
  if (props.widget.type !== 'HITOKOTO') return '';
  const fallback = normalized.value as { from?: string };
  const parts = [remoteHitokoto.value?.from_who, remoteHitokoto.value?.from]
    .filter((item): item is string => Boolean(item))
    .filter((item, index, source) => source.indexOf(item) === index);
  return parts.join(' / ') || fallback.from || '';
});

function handleRefreshHitokoto() {
  void refreshHitokoto();
}

function getSocialIconUrl(social: ProfileSocial) {
  const icon = social.icon?.trim();
  if (!icon || icon.startsWith('http')) return icon || '';
  const simpleIcon = icon === 'douyin' ? 'tiktok' : icon;
  const color =
    normalizeIconColor(social.color) ||
    getSocialDefaultColor(social.platform) ||
    getSocialDefaultColor(simpleIcon) ||
    '111827';
  return `https://cdn.simpleicons.org/${encodeURIComponent(simpleIcon)}/${color}`;
}

function getSocialLabel(social: ProfileSocial) {
  return social.label || social.platform || '社交链接';
}

function normalizeIconColor(value?: string) {
  const text = value?.trim().replace(/^#/, '') ?? '';
  return /^[0-9a-fA-F]{6}$/.test(text) ? text : '';
}

function getSocialDefaultColor(value?: string) {
  return value ? socialDefaultColors[value.trim().toLowerCase()] || '' : '';
}

const playlistSource = computed(() => {
  if (props.widget.type !== 'MUSIC_PLAYER') return null;
  const source = normalized.value.playlistSource as Record<string, unknown> | undefined;
  if (!source || readConfigString(source, 'provider') !== 'netease') return null;
  const url = readConfigString(source, 'url');
  return url ? { provider: 'netease', url } : null;
});

const { data: remotePlaylist } = useAsyncData(
  `widget-music-playlist-${props.widget.id}`,
  () =>
    playlistSource.value?.url
      ? requestPublicApi<{
          tracks: Array<Record<string, unknown>>;
        }>(`/public/music/netease/playlist?url=${encodeURIComponent(playlistSource.value.url)}`).catch(() => ({
          tracks: [],
        }))
      : Promise.resolve({ tracks: [] }),
  { watch: [playlistSource] },
);

const configuredPlaylist = computed(() =>
  ((normalized.value.playlist as Record<string, unknown>[] | undefined) ?? [])
    .map(normalizePlaylistTrack)
    .filter((track) => track.audioUrl || track.embedUrl || track.externalUrl),
);
const playlist = computed(() =>
  props.widget.type === 'MUSIC_PLAYER'
    ? ((remotePlaylist.value?.tracks?.length ? remotePlaylist.value.tracks : configuredPlaylist.value)
        .map(normalizePlaylistTrack)
        .filter((track) => track.audioUrl || track.embedUrl || track.externalUrl))
    : [],
);
const currentTrack = computed(() => playlist.value[playlistIndex.value] ?? null);
const currentTrackMetadataUrl = computed(
  () => currentTrack.value?.externalUrl || currentTrack.value?.embedUrl || '',
);
const { data: currentTrackMetadata } = useAsyncData(
  `widget-music-metadata-${props.widget.id}`,
  () =>
    currentTrackMetadataUrl.value && !currentTrack.value?.cover
      ? requestPublicApi<{ cover: string }>(
          `/public/music/netease/metadata?url=${encodeURIComponent(currentTrackMetadataUrl.value)}`,
        ).catch(() => ({ cover: '' }))
      : Promise.resolve({ cover: '' }),
  { watch: [currentTrackMetadataUrl] },
);
const displayTitle = computed(
  () =>
    currentTrack.value?.title ||
    (normalized.value.defaultTitle as string) ||
    'No playlist',
);
const displayArtist = computed(
  () =>
    currentTrack.value?.artist ||
    (normalized.value.defaultArtist as string) ||
    'Add music in admin',
);
const displayCover = computed(
  () =>
    resolveAssetUrl(currentTrack.value?.cover) ||
    resolveAssetUrl(currentTrackMetadata.value?.cover) ||
    (normalized.value.cover as string) ||
    '',
);

watch(
  () => [isPlaying.value, currentTrack.value?.id],
  () => {
    resetProgress();
    void syncMusicPlayback();
    syncProgressTimer();
  },
  { flush: 'post' },
);

watch(
  () => playlist.value.length,
  () => {
    if (playlistIndex.value >= playlist.value.length) {
      playlistIndex.value = 0;
    }
  },
);

async function syncMusicPlayback() {
  if (props.widget.type !== 'MUSIC_PLAYER') return;
  const track = currentTrack.value;
  if (!track) {
    activeEmbedUrl.value = '';
    isPlaying.value = false;
    syncProgressTimer();
    return;
  }

  if (track.audioUrl && audioRef.value) {
    activeEmbedUrl.value = '';
    if (isPlaying.value) {
      await audioRef.value.play();
    } else {
      audioRef.value.pause();
    }
    syncProgressTimer();
    return;
  }

  if (track.embedUrl) {
    activeEmbedUrl.value = isPlaying.value ? withAutoplay(track.embedUrl) : '';
    syncProgressTimer();
  }
}

function toggleMusic() {
  if (!currentTrack.value) return;
  isPlaying.value = !isPlaying.value;
}

function playPreviousTrack() {
  if (playlist.value.length === 0) return;
  playlistIndex.value = (playlistIndex.value - 1 + playlist.value.length) % playlist.value.length;
  isPlaying.value = true;
}

function playNextTrack() {
  if (playlist.value.length === 0) return;
  playlistIndex.value = (playlistIndex.value + 1) % playlist.value.length;
  isPlaying.value = true;
}

function selectPlaylistTrack(index: number) {
  playlistIndex.value = index;
  isPlaying.value = true;
  isPlaylistOpen.value = false;
}

function resetProgress() {
  simulatedCurrentTime.value = 0;
  progressRatio.value = 0;
  currentTimeLabel.value = '0:00';
  durationLabel.value = currentTrack.value?.duration ? formatMusicTime(currentTrack.value.duration) : '0:00';
}

function updateAudioProgress() {
  const audio = audioRef.value;
  if (!audio) return;
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  progressRatio.value = duration > 0 ? Math.min(audio.currentTime / duration, 1) : 0;
  currentTimeLabel.value = formatMusicTime(audio.currentTime);
  durationLabel.value = duration > 0 ? formatMusicTime(duration) : '0:00';
}

function syncProgressTimer() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = undefined;
  }

  const track = currentTrack.value;
  if (!isPlaying.value || !track || track.audioUrl || !track.duration) return;

  durationLabel.value = formatMusicTime(track.duration);
  progressTimer = setInterval(() => {
    simulatedCurrentTime.value = Math.min(simulatedCurrentTime.value + 1, track.duration || 0);
    progressRatio.value = track.duration ? simulatedCurrentTime.value / track.duration : 0;
    currentTimeLabel.value = formatMusicTime(simulatedCurrentTime.value);
    durationLabel.value = formatMusicTime(track.duration || 0);

    if (track.duration && simulatedCurrentTime.value >= track.duration) {
      playNextTrack();
    }
  }, 1000);
}

function formatMusicTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  return `${apiBaseUrl}${url}`;
}

function normalizePlaylistTrack(track: Record<string, unknown>) {
  const title = readConfigString(track, 'title') || 'Music';
  const artist = readConfigString(track, 'artist') || 'Unknown artist';
  const audioUrl = resolveAssetUrl(readConfigString(track, 'audioUrl'));
  const embedUrl = readConfigString(track, 'embedUrl');
  const externalUrl = readConfigString(track, 'externalUrl');
  const cover = resolveAssetUrl(readConfigString(track, 'cover') || readConfigString(track, 'coverUrl'));
  const rawDuration = track.duration;
  const duration = typeof rawDuration === 'number' ? rawDuration : Number(rawDuration || 0);

  return {
    id: audioUrl || embedUrl || externalUrl || `${title}-${artist}`,
    title,
    artist,
    cover,
    audioUrl,
    embedUrl,
    externalUrl,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
  };
}

function readConfigString(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function readObject(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

const friendConfig = computed(() =>
  props.widget.type === 'FRIEND_LINKS'
    ? (normalized.value as { category: string; limit: number; random: boolean })
    : null,
);

const { data: friendLinksData } = await useAsyncData(
  `widget-friend-links-${props.widget.id}`,
  () => (props.widget.type === 'FRIEND_LINKS' ? listPublicFriendLinks() : Promise.resolve([])),
);

const friendLinks = computed(() => {
  if (!friendConfig.value) return [];
  const filtered = (friendLinksData.value ?? []).filter((link) =>
    friendConfig.value?.category ? link.category === friendConfig.value.category : true,
  );
  const ordered = friendConfig.value.random
    ? [...filtered].sort(() => Math.random() - 0.5)
    : filtered;
  return ordered.slice(0, friendConfig.value.limit || 6);
});

onBeforeUnmount(() => {
  if (progressTimer) clearInterval(progressTimer);
});
</script>

<template>
  <section
    class="app-card widget-card"
    :class="[
      { 'music-widget-card': widget.type === 'MUSIC_PLAYER' },
      { 'date-widget-card': widget.type === 'DATE_CARD' },
      widget.type === 'MUSIC_PLAYER' ? 'u-shadow-none' : '',
    ]"
  >
    <template v-if="widget.type === 'MUSIC_PLAYER'">
      <div class="music-panel u-shadow-panel">
        <button
          type="button"
          class="playlist-toggle u-shadow-toggle"
          aria-label="Open playlist"
          @click="isPlaylistOpen = true"
        >
          <ListMusic :size="16" stroke-width="1.8" />
        </button>

        <div class="music-visual">
          <img
            class="vinyl-disc"
            :class="{ spinning: isPlaying }"
            src="/images/music-disc-glow.png"
            alt=""
          />
          <div class="music-cover-large u-shadow-cover">
            <img v-if="displayCover" :src="displayCover" alt="" />
            <span v-else>Music</span>
          </div>
        </div>

        <div class="music-meta">
          <strong>{{ displayTitle }}</strong>
          <p>{{ displayArtist }}</p>
        </div>

        <div class="music-progress">
          <div class="progress-track">
            <span class="progress-fill" :style="{ width: `${progressRatio * 100}%` }"></span>
          </div>
          <div class="progress-time">
            <span>{{ currentTimeLabel }}</span>
            <span>{{ durationLabel }}</span>
          </div>
        </div>

        <div class="music-controls">
          <button type="button" aria-label="Previous track" @click="playPreviousTrack">
            <SkipBack :size="17" stroke-width="1.8" />
          </button>
          <button
            type="button"
            class="main-control u-shadow-primary-control"
            :aria-label="isPlaying ? 'Pause' : 'Play'"
            @click="toggleMusic"
          >
            <Pause v-if="isPlaying" :size="20" stroke-width="2.2" />
            <Play v-else :size="20" stroke-width="2" fill="currentColor" />
          </button>
          <button type="button" aria-label="Next track" @click="playNextTrack">
            <SkipForward :size="17" stroke-width="1.8" />
          </button>
        </div>

        <audio
          v-if="currentTrack?.audioUrl"
          ref="audioRef"
          :src="currentTrack.audioUrl"
          preload="metadata"
          @loadedmetadata="updateAudioProgress"
          @timeupdate="updateAudioProgress"
          @ended="playNextTrack"
        />
        <iframe
          v-if="activeEmbedUrl"
          class="hidden-player"
          :src="activeEmbedUrl"
          title="Music player"
          frameborder="0"
          allow="autoplay"
        />

        <Transition name="playlist-panel">
          <div v-if="isPlaylistOpen" class="playlist-overlay u-shadow-inset-overlay">
            <div class="playlist-head">
              <strong>播放列表</strong>
              <button type="button" aria-label="Close playlist" @click="isPlaylistOpen = false">
                <X :size="16" stroke-width="1.8" />
              </button>
            </div>
            <div class="playlist-scroll">
              <button
                v-for="(track, index) in playlist"
                :key="track.id"
                type="button"
                class="playlist-item"
                :class="{ active: index === playlistIndex }"
                @click="selectPlaylistTrack(index)"
              >
                <img v-if="track.cover" :src="track.cover" alt="" />
                <span v-else class="playlist-cover-fallback">{{ index + 1 }}</span>
                <span class="playlist-text">
                  <strong>{{ track.title }}</strong>
                  <small>{{ track.artist }}</small>
                </span>
                <small v-if="track.duration" class="playlist-duration">
                  {{ formatMusicTime(track.duration) }}
                </small>
              </button>
              <div v-if="playlist.length === 0" class="playlist-empty">暂无歌曲</div>
            </div>
          </div>
        </Transition>
      </div>
    </template>
    <template v-else-if="widget.type === 'HITOKOTO'">
      <div class="hitokoto-card">
        <div class="hitokoto-body">
          <button
            type="button"
            class="hitokoto-refresh"
            :class="{ loading: isHitokotoPending }"
            aria-label="Refresh hitokoto"
            :disabled="isHitokotoPending"
            @click="handleRefreshHitokoto"
          >
            <RefreshCw :size="14" stroke-width="1.8" />
          </button>
          <Transition name="hitokoto-text" mode="out-in">
            <strong :key="hitokotoText">{{ hitokotoText }}</strong>
          </Transition>
          <Transition name="hitokoto-source" mode="out-in">
            <span v-if="hitokotoSource" :key="hitokotoSource" class="muted">{{ hitokotoSource }}</span>
          </Transition>
        </div>
      </div>
    </template>

    <template v-else-if="widget.type === 'FRIEND_LINKS'">
      <div class="widget-heading">{{ widget.title || '友情链接' }}</div>
      <div class="link-list">
        <a v-for="link in friendLinks" :key="link.id" :href="link.url" target="_blank">
          <img v-if="link.logo" :src="link.logo" :alt="link.name" />
          <span v-else>{{ link.name.slice(0, 1) }}</span>
          <strong>{{ link.name }}</strong>
        </a>
      </div>
    </template>
    <template v-else-if="widget.type === 'PROFILE'">
      <div class="profile-card-new">
        <div class="profile-content-row">
          <div class="profile-avatar-wrapper-new">
            <img
              v-if="normalized.avatar"
              class="profile-avatar-img"
              :src="normalized.avatar as string"
              :alt="(normalized.name as string) || ''"
            />
            <div v-else class="profile-avatar-img profile-avatar-fallback-new">
              {{ ((normalized.name as string) || 'U').slice(0, 1) }}
            </div>
          </div>
          <div class="profile-info-new">
            <div class="profile-name-row-new">
              <strong class="profile-name-new">{{ normalized.name || '星辰' }}</strong>
              <span class="profile-badge-new">⭐</span>
            </div>
            <p class="profile-bio-new">{{ normalized.bio || '热爱技术与设计，专注于创造有价值的产品体验 ✨' }}</p>
          </div>
        </div>
        <div v-if="Array.isArray(normalized.socials) && normalized.socials.length" class="profile-socials-new">
          <a
            v-for="social in normalized.socials"
            :key="social.platform || social.url || social.qrCode"
            :href="social.url || undefined"
            target="_blank"
            rel="noopener noreferrer"
            class="social-icon-link-new"
            :title="getSocialLabel(social)"
          >
            <img v-if="getSocialIconUrl(social)" :src="getSocialIconUrl(social)" :alt="getSocialLabel(social)" />
            <span v-else class="social-text-icon">{{ getSocialLabel(social).slice(0, 2) }}</span>
          </a>
        </div>
      </div>
    </template>

    <template v-else-if="widget.type === 'DATE_CARD'">
      <DateCardWidget :widget="widget" :normalized="normalized" />
    </template>

    <template v-else-if="widget.type === 'PHOTO_GALLERY' && Array.isArray(normalized.images)">
      <div class="widget-heading">{{ widget.title || '照片' }}</div>
      <div class="photo-grid">
        <figure v-for="image in normalized.images" :key="image.url">
          <img :src="image.url" :alt="image.alt || image.caption || ''" />
          <figcaption v-if="image.caption">{{ image.caption }}</figcaption>
        </figure>
      </div>
    </template>

    <template v-else-if="widget.type === 'PROJECT_TREE'">
      <ProjectTreeWidget :widget="widget" :normalized="normalized" />
    </template>
  </section>
</template>

<style scoped>
.widget-card {
  padding: 16px;
}

.music-widget-card {
  padding: 0;
  overflow: visible;
  border: 0;
  background: transparent;
}

.date-widget-card {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.widget-heading {
  margin-bottom: 12px;
  font-weight: 700;
}

p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.muted {
  display: block;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 13px;
}

.hitokoto-card {
  overflow: hidden;
  margin: -16px;
  border-radius: inherit;
  background: #fff;
}

.hitokoto-refresh {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: var(--radius);
  background: #f5f6f8;
  color: #303138;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.hitokoto-refresh:hover:not(:disabled) {
  background: #eef1f6;
  transform: translateY(-1px);
}

.hitokoto-refresh:disabled {
  cursor: default;
  opacity: 0.7;
}

.hitokoto-refresh.loading svg {
  animation: hitokoto-refresh-spin 0.8s linear infinite;
}

.hitokoto-body {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 10px;
  min-height: 126px;
  padding: 18px 20px 20px;
}

.hitokoto-body strong {
  padding-right: 38px;
  color: var(--text);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.65;
}

.hitokoto-body .muted {
  justify-self: end;
  align-self: end;
  margin-top: 0;
  text-align: right;
}

.hitokoto-text-enter-active,
.hitokoto-text-leave-active,
.hitokoto-source-enter-active,
.hitokoto-source-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.hitokoto-text-enter-from,
.hitokoto-source-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.hitokoto-text-leave-to,
.hitokoto-source-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Profile Widget - New Card Style */
.profile-card-new {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
  margin: -16px;
  border-radius: inherit;
  background: linear-gradient(135deg, #e8f4fd 0%, #f3e8fc 50%, #fce8f3 100%);
  padding: 24px 20px 20px;
}

.profile-card-new::before {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 182, 193, 0.35) 0%, transparent 70%);
  content: '';
}

.profile-card-new::after {
  position: absolute;
  bottom: -30px;
  left: -30px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(173, 216, 230, 0.28) 0%, transparent 70%);
  content: '';
}

.profile-content-row {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.profile-avatar-wrapper-new {
  flex-shrink: 0;
}

.profile-avatar-img {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.9);
}

.profile-avatar-fallback-new {
  font-size: 26px;
  font-weight: 700;
  color: #6366f1;
}

.profile-info-new {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding-top: 4px;
}

.profile-name-row-new {
  display: flex;
  align-items: center;
  gap: 6px;
}

.profile-name-new {
  color: #1a1a2e;
  font-size: 19px;
  font-weight: 750;
  line-height: 1.2;
}

.profile-badge-new {
  font-size: 16px;
}

.profile-bio-new {
  margin: 0;
  color: #4a4a6a;
  font-size: 13px;
  line-height: 1.65;
}

.profile-socials-new {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  padding-top: 2px;
}

.social-icon-link-new {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.social-icon-link-new:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.social-icon-link-new img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.social-text-icon {
  color: #4a4a6a;
  font-size: 11px;
  font-weight: 700;
}

.link-list {
  display: grid;
  gap: 8px;
}

.link-list a {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius);
  padding: 7px;
}

.link-list a:hover {
  background: var(--hover-bg);
}

.link-list img,
.link-list span {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--radius);
  background: var(--hover-bg);
  object-fit: cover;
  font-size: 12px;
}

.photo-grid {
  display: grid;
  gap: 10px;
}

figure {
  margin: 0;
}

figure img {
  aspect-ratio: 16 / 10;
  width: 100%;
  border-radius: var(--radius);
  object-fit: cover;
}

figcaption {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.music-panel {
  position: relative;
  display: grid;
  gap: 12px;
  padding: 16px 16px 18px;
  overflow: hidden;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: var(--radius);
  background: #fff;
  color: #2b2d33;
}

.playlist-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.86);
  color: #303238;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.playlist-toggle:hover {
  background: #fff;
  transform: translateY(-1px);
}

.music-visual {
  position: relative;
  height: 146px;
}

.music-cover-large {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  display: grid;
  width: 132px;
  height: 132px;
  place-items: center;
  overflow: hidden;
  border-radius: var(--radius);
  background: #eef1f5;
  color: #5f6673;
  font-weight: 700;
}

.music-cover-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vinyl-disc {
  position: absolute;
  left: 68px;
  top: 6px;
  width: 126px;
  height: auto;
  opacity: 1;
  object-fit: contain;
  transform-origin: center;
}

.vinyl-disc.spinning {
  animation: vinyl-spin 4.8s linear infinite;
}

.music-meta {
  display: grid;
  gap: 3px;
}

.music-meta strong {
  overflow: hidden;
  color: #2f3137;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-meta p {
  margin: 0;
  overflow: hidden;
  color: #858891;
  font-size: 12px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-progress {
  display: grid;
  gap: 7px;
}

.progress-track {
  height: 5px;
  overflow: hidden;
  border-radius: var(--radius);
  background: #e7e7e7;
}

.progress-fill {
  display: block;
  width: 22%;
  height: 100%;
  border-radius: inherit;
  background: #2f3137;
}

.progress-time {
  display: flex;
  justify-content: space-between;
  color: #80838a;
  font-size: 12px;
  font-weight: 500;
}

.music-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.music-controls button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: var(--radius);
  background: transparent;
  color: #303238;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.music-controls button:hover {
  background: #f4f4f4;
  transform: translateY(-1px);
}

.music-controls .main-control {
  width: 44px;
  height: 44px;
  background: #fff;
}

.hidden-player {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.playlist-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px);
  color: #2b2d33;
}

.playlist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px;
}

.playlist-head strong {
  font-size: 14px;
  font-weight: 700;
}

.playlist-head button {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.72);
  color: #303238;
  cursor: pointer;
}

.playlist-scroll {
  display: grid;
  align-content: start;
  gap: 6px;
  overflow-y: auto;
  padding: 0 10px 12px;
}

.playlist-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  width: 100%;
  border: 0;
  border-radius: var(--radius);
  background: transparent;
  padding: 7px;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.playlist-item:hover,
.playlist-item.active {
  background: rgba(255, 255, 255, 0.72);
}

.playlist-item img,
.playlist-cover-fallback {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: var(--radius);
  background: #eef1f5;
  object-fit: cover;
  color: #858891;
  font-size: 12px;
  font-weight: 700;
}

.playlist-text {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.playlist-text strong,
.playlist-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-text strong {
  font-size: 13px;
  font-weight: 650;
}

.playlist-text small,
.playlist-duration {
  color: #737780;
  font-size: 11px;
}

.playlist-duration {
  white-space: nowrap;
}

.playlist-empty {
  padding: 44px 12px;
  color: #858891;
  text-align: center;
  font-size: 13px;
}

.playlist-panel-enter-active,
.playlist-panel-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.playlist-panel-enter-from,
.playlist-panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@keyframes vinyl-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes hitokoto-refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
