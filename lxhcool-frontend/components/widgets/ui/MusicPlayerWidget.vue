<script setup lang="ts">
import type { SiteWidget } from '~/entities/widget/model/types';
import { useMusicPlayerSetup } from '../strategies/useMusicPlayer';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';
import { ListMusic, Pause, Play, SkipBack, SkipForward, X } from '@lucide/vue';

const props = defineProps<{ widget: SiteWidget; normalized: Record<string, unknown> }>();
const { apiBaseUrl } = getRequiredPublicRuntimeConfig();

const widgetRef = toRef(props, 'widget');
const {
  audioRef, activeEmbedUrl, isPlaying, isPlaylistOpen, playlistIndex,
  progressRatio, currentTimeLabel, durationLabel,
  playlist, currentTrack, displayTitle, displayArtist, displayCover,
  toggleMusic, playPreviousTrack, playNextTrack, selectPlaylistTrack,
  updateAudioProgress, formatTime,
} = useMusicPlayerSetup(widgetRef, apiBaseUrl);
</script>

<template>
  <div class="music-panel u-shadow-panel">
    <button type="button" class="playlist-toggle u-shadow-toggle"
      aria-label="Open playlist" @click="isPlaylistOpen = true">
      <ListMusic :size="16" stroke-width="1.8" />
    </button>

    <div class="music-visual">
      <img class="vinyl-disc" :class="{ spinning: isPlaying }" src="/images/music-disc-glow.png" alt="" />
      <div class="music-cover u-shadow-cover">
        <img v-if="displayCover" :src="displayCover" alt="" />
        <span v-else class="music-cover-fallback">♪</span>
      </div>
    </div>

    <div class="music-meta">
      <strong class="music-title">{{ displayTitle }}</strong>
      <p class="music-artist">{{ displayArtist }}</p>
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
      <button type="button" aria-label="Previous" @click="playPreviousTrack">
        <SkipBack :size="17" stroke-width="1.8" />
      </button>
      <button type="button" class="main-control u-shadow-primary-control"
        :aria-label="isPlaying ? 'Pause' : 'Play'" @click="toggleMusic">
        <Pause v-if="isPlaying" :size="20" stroke-width="2.2" />
        <Play v-else :size="20" stroke-width="2" fill="currentColor" />
      </button>
      <button type="button" aria-label="Next" @click="playNextTrack">
        <SkipForward :size="17" stroke-width="1.8" />
      </button>
    </div>

    <audio v-if="currentTrack?.audioUrl"
      ref="audioRef"
      :src="currentTrack.audioUrl"
      preload="metadata"
      @loadedmetadata="updateAudioProgress"
      @timeupdate="updateAudioProgress"
      @ended="playNextTrack" />

    <iframe v-if="activeEmbedUrl" class="hidden-player" :src="activeEmbedUrl"
      title="Music player" frameborder="0" allow="autoplay" />

    <Transition name="playlist-panel">
      <div v-if="isPlaylistOpen" class="playlist-overlay u-shadow-inset-overlay">
        <div class="playlist-head">
          <strong>播放列表</strong>
          <button type="button" aria-label="Close" @click="isPlaylistOpen = false">
            <X :size="16" stroke-width="1.8" />
          </button>
        </div>
        <div class="playlist-scroll">
          <button v-for="(track, index) in playlist" :key="track.id"
            type="button" class="playlist-item"
            :class="{ active: index === playlistIndex }"
            @click="selectPlaylistTrack(index)">
            <img v-if="track.cover" :src="track.cover" alt="" class="pl-cover" />
            <span v-else class="pl-cover-fallback">{{ index + 1 }}</span>
            <span class="pl-text">
              <strong>{{ track.title }}</strong>
              <small>{{ track.artist }}</small>
            </span>
            <small v-if="track.duration" class="pl-duration">{{ formatTime(track.duration) }}</small>
          </button>
          <div v-if="playlist.length === 0" class="playlist-empty">暂无歌曲</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.music-panel {
  position: relative;
  display: grid;
  gap: 12px;
  padding: 16px 16px 18px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  background: var(--card-bg);
  color: var(--text-primary);
}

.playlist-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--hover-bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.playlist-toggle:hover {
  background: var(--hover-bg-strong);
  transform: translateY(-1px);
}

.music-visual {
  position: relative;
  height: 146px;
}

.music-cover {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 132px;
  height: 132px;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--hover-bg);
}

.music-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-cover-fallback {
  color: var(--text-tertiary);
  font-size: 36px;
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

.music-title {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-artist {
  margin: 0;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-progress {
  display: grid;
  gap: 7px;
}

.progress-track {
  height: 4px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--hover-bg);
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 0.15s linear;
}

.progress-time {
  display: flex;
  justify-content: space-between;
  color: var(--text-tertiary);
  font-size: 11px;
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
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.music-controls button:hover {
  background: var(--hover-bg);
  transform: translateY(-1px);
}

.music-controls .main-control {
  width: 44px;
  height: 44px;
  background: var(--card-bg);
}

.hidden-player {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

/* Playlist overlay */
.playlist-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--text-primary);
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
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--hover-bg);
  color: var(--text-secondary);
  cursor: pointer;
}

.playlist-scroll {
  display: grid;
  align-content: start;
  gap: 4px;
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
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 7px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.playlist-item:hover,
.playlist-item.active {
  background: rgba(255, 255, 255, 0.6);
}

.pl-cover,
.pl-cover-fallback {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--hover-bg);
  object-fit: cover;
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.pl-text {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.pl-text strong,
.pl-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pl-text strong {
  font-size: 13px;
  font-weight: 650;
}

.pl-text small,
.pl-duration {
  color: var(--text-tertiary);
  font-size: 11px;
}

.pl-duration {
  white-space: nowrap;
}

.playlist-empty {
  padding: 44px 12px;
  color: var(--text-tertiary);
  text-align: center;
  font-size: 13px;
}

.playlist-panel-enter-active,
.playlist-panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.playlist-panel-enter-from,
.playlist-panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@keyframes vinyl-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
