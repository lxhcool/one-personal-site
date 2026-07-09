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
  playlist, currentTrack, displayTitle, displayArtist,
  toggleMusic, playPreviousTrack, playNextTrack, selectPlaylistTrack,
  updateAudioProgress, formatTime,
} = useMusicPlayerSetup(widgetRef, apiBaseUrl);
</script>

<template>
  <div class="player">
    <!-- 歌曲信息 -->
    <div class="player-info">
      <span class="player-title">{{ displayTitle }}</span>
      <span class="player-artist">{{ displayArtist }}</span>
    </div>

    <!-- 进度条 -->
    <div class="player-progress">
      <div class="progress-bar">
        <span class="progress-fill" :style="{ width: `${progressRatio * 100}%` }" />
      </div>
      <div class="progress-time">
        <span>{{ currentTimeLabel }}</span>
        <span>{{ durationLabel }}</span>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="player-controls">
      <button type="button" class="ctrl-btn" aria-label="Previous" @click="playPreviousTrack">
        <SkipBack :size="14" stroke-width="2" />
      </button>
      <button type="button" class="ctrl-btn is-main" :aria-label="isPlaying ? 'Pause' : 'Play'" @click="toggleMusic">
        <Pause v-if="isPlaying" :size="16" stroke-width="2.2" />
        <Play v-else :size="16" stroke-width="2" fill="currentColor" />
      </button>
      <button type="button" class="ctrl-btn" aria-label="Next" @click="playNextTrack">
        <SkipForward :size="14" stroke-width="2" />
      </button>
      <button type="button" class="ctrl-btn" aria-label="Playlist" @click="isPlaylistOpen = true">
        <ListMusic :size="14" stroke-width="2" />
      </button>
    </div>

    <!-- 隐藏播放器 -->
    <audio v-if="currentTrack?.audioUrl"
      ref="audioRef"
      :src="currentTrack.audioUrl"
      preload="metadata"
      @loadedmetadata="updateAudioProgress"
      @timeupdate="updateAudioProgress"
      @ended="playNextTrack" />
    <iframe v-if="activeEmbedUrl" class="hidden-player" :src="activeEmbedUrl"
      title="Music player" frameborder="0" allow="autoplay" />

    <!-- 播放列表弹窗 -->
    <Transition name="playlist">
      <div v-if="isPlaylistOpen" class="playlist-overlay">
        <div class="playlist-head">
          <span>播放列表</span>
          <button type="button" aria-label="Close" @click="isPlaylistOpen = false">
            <X :size="14" stroke-width="2" />
          </button>
        </div>
        <div class="playlist-body">
          <button v-for="(track, index) in playlist" :key="track.id"
            type="button" class="playlist-track"
            :class="{ active: index === playlistIndex }"
            @click="selectPlaylistTrack(index)">
            <span class="pl-index">{{ index + 1 }}</span>
            <span class="pl-info">
              <strong>{{ track.title }}</strong>
              <small>{{ track.artist }}</small>
            </span>
            <small v-if="track.duration" class="pl-time">{{ formatTime(track.duration) }}</small>
          </button>
          <div v-if="playlist.length === 0" class="playlist-empty">暂无歌曲</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.player {
  --ink: #3a4654;
  --muted: #8b919a;

  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 260px;
  padding: 14px 16px 16px;
  border-radius: 8px;
  background: rgba(250, 251, 252, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  user-select: none;
}

/* 歌曲信息 */
.player-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.player-title {
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-artist {
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 进度条 */
.player-progress {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.progress-bar {
  height: 3px;
  overflow: hidden;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.08);
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--ink);
  transition: width 0.15s linear;
}

.progress-time {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 10px;
  font-weight: 500;
}

/* 控制按钮 */
.player-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.ctrl-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
  opacity: 0.55;
}

.ctrl-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  opacity: 0.85;
}

.ctrl-btn:active {
  transform: scale(0.93);
}

.ctrl-btn.is-main {
  width: 34px;
  height: 34px;
  opacity: 0.85;
  background: rgba(0, 0, 0, 0.04);
}

.ctrl-btn.is-main:hover {
  background: rgba(0, 0, 0, 0.08);
  opacity: 1;
}

/* 隐藏播放器 */
.hidden-player {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

/* 播放列表 */
.playlist-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: inherit;
  background: rgba(250, 251, 252, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.playlist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  flex-shrink: 0;
}

.playlist-head span {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
}

.playlist-head button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--ink);
  cursor: pointer;
}

.playlist-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  padding: 0 10px 10px;
  flex: 1;
}

.playlist-track {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  border-radius: 6px;
  background: transparent;
  padding: 6px 8px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;
}

.playlist-track:hover,
.playlist-track.active {
  background: rgba(0, 0, 0, 0.04);
}

.pl-index {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
}

.playlist-track.active .pl-index {
  background: var(--ink);
  color: #fff;
}

.pl-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.pl-info strong,
.pl-info small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pl-info strong {
  font-size: 11px;
  font-weight: 650;
  color: var(--ink);
}

.pl-info small {
  font-size: 10px;
  color: var(--muted);
}

.pl-time {
  color: var(--muted);
  font-size: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.playlist-empty {
  padding: 32px 12px;
  color: var(--muted);
  text-align: center;
  font-size: 12px;
}

/* transition */
.playlist-enter-active,
.playlist-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.playlist-enter-from,
.playlist-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
</style>
