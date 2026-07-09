<script setup lang="ts">
import { Pause, Play, Shuffle, Repeat, Repeat1, Volume1, Volume2, VolumeX, SkipBack, SkipForward } from '@lucide/vue';
import { useStandaloneMusicPlayer } from '~/composables/useStandaloneMusicPlayer';

const {
  audioRef, activeEmbedUrl, isPlaying, playlistIndex,
  playlist, currentTrack, displayTitle, displayArtist,
  playMode, playModeLabel, volume, isMuted,
  toggleMusic, playPreviousTrack, playNextTrack, selectPlaylistTrack,
  togglePlayMode, setVolume, toggleMute,
  updateAudioProgress, seekTo, progressRatio, currentTimeLabel, durationLabel,
} = useStandaloneMusicPlayer();
</script>

<template>
  <div class="music-outer">
    <div class="music-shell">
      <!-- 行1：当前歌曲 & 播放控制 -->
      <div class="player-head">
        <span class="np-title">{{ displayTitle }}</span>
        <div class="player-ctrls">
          <button type="button" class="ctrl-btn" aria-label="Previous" @click="playPreviousTrack">
            <SkipBack :size="13" stroke-width="2" />
          </button>
          <button type="button" class="ctrl-btn is-main" :aria-label="isPlaying ? 'Pause' : 'Play'" @click="toggleMusic">
            <Pause v-if="isPlaying" :size="15" stroke-width="2.2" />
            <Play v-else :size="15" stroke-width="2" />
          </button>
          <button type="button" class="ctrl-btn" aria-label="Next" @click="playNextTrack">
            <SkipForward :size="13" stroke-width="2" />
          </button>
        </div>
      </div>

      <!-- 行2：艺术家 & 音量控制 -->
      <div class="artist-row">
        <span class="np-artist">{{ displayArtist }}</span>
        <div class="vol-group">
          <button type="button" class="mini-btn" :aria-label="isMuted ? '取消静音' : '静音'" @click="toggleMute">
            <VolumeX v-if="isMuted || volume === 0" :size="11" stroke-width="1.8" />
            <Volume1 v-else-if="volume < 0.5" :size="11" stroke-width="1.8" />
            <Volume2 v-else :size="11" stroke-width="1.8" />
          </button>
          <input
            type="range"
            class="vol-slider"
            min="0"
            max="1"
            step="0.05"
            :value="isMuted ? 0 : volume"
            @input="setVolume(($event.target as HTMLInputElement).valueAsNumber)"
          />
          <button
            type="button"
            class="mini-btn mode-btn"
            :aria-label="`播放模式：${playModeLabel}`"
            :title="playModeLabel"
            @click="togglePlayMode"
          >
            <Shuffle v-if="playMode === 'shuffle'" :size="11" stroke-width="1.8" />
            <Repeat1 v-else-if="playMode === 'repeat-one'" :size="11" stroke-width="1.8" />
            <Repeat v-else-if="playMode === 'repeat'" :size="11" stroke-width="1.8" />
            <span v-else class="mode-text">↻</span>
          </button>
        </div>
      </div>

      <!-- 行2：进度条 -->
      <div class="progress-row">
        <span class="prog-time">{{ currentTimeLabel }}</span>
        <div class="prog-track" @click="seekTo(($event.offsetX / ($event.currentTarget as HTMLElement).offsetWidth))">
          <div class="prog-fill" :style="{ width: (progressRatio * 100) + '%' }" />
        </div>
        <span class="prog-time">{{ durationLabel }}</span>
      </div>

      <!-- 播放列表 -->
      <div class="playlist">
        <button
          v-for="(track, index) in playlist"
          :key="track.id"
          type="button"
          class="track-item"
          :class="{ active: index === playlistIndex }"
          @click="selectPlaylistTrack(index)"
        >
          <span v-if="index === playlistIndex && isPlaying" class="trk-eq">
            <span class="eq-bar" />
            <span class="eq-bar" />
            <span class="eq-bar" />
            <span class="eq-bar" />
          </span>
          <span v-else class="trk-idx">{{ index + 1 }}</span>
          <span class="trk-info">
            <span class="trk-title">{{ track.title }}</span>
          </span>
        </button>
        <div v-if="playlist.length === 0" class="playlist-empty">
          暂无歌曲
        </div>
      </div>

      <!-- 隐藏播放器 -->
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
    </div>
  </div>
</template>

<style scoped>
.music-outer {
  display: inline-block;
  transform: rotate(-5.5deg);
  transform-origin: 30% 50%;
}

.music-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 220px;
  user-select: none;
}

/* ── 行1：歌名 + 播放控制 ── */
.player-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.np-title {
  color: #3a4654;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

/* ── 行2：艺术家 left / 音量组 right ── */
.artist-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  margin-top: -4px;
}

.np-artist {
  color: #6b7280;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}

.vol-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.player-ctrls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ctrl-btn {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #3a4654;
  cursor: pointer;
  opacity: 0.45;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.ctrl-btn:hover {
  opacity: 0.8;
  background: rgba(58, 70, 84, 0.06);
}

.ctrl-btn:active {
  transform: scale(0.92);
}

.ctrl-btn.is-main {
  opacity: 0.75;
  background: rgba(58, 70, 84, 0.06);
}

.ctrl-btn.is-main:hover {
  opacity: 1;
  background: rgba(58, 70, 84, 0.1);
}

/* ── 行2：进度条 ── */
.progress-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.prog-time {
  font-size: 9px;
  font-weight: 500;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 28px;
  text-align: center;
  line-height: 1;
}

.prog-track {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: rgba(58, 70, 84, 0.1);
  cursor: pointer;
  overflow: hidden;
  min-width: 0;
  transition: height 0.15s ease;
}

.prog-track:hover {
  height: 5px;
}

.prog-fill {
  height: 100%;
  border-radius: 2px;
  background: #3a4654;
  transition: width 0.15s linear;
}

.mini-btn {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.4;
  transition: opacity 0.15s ease;
}

.mini-btn:hover {
  opacity: 0.75;
}

.vol-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 52px;
  height: 3px;
  border-radius: 2px;
  background: rgba(58, 70, 84, 0.1);
  outline: none;
  cursor: pointer;
  flex-shrink: 0;
}

.vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  cursor: pointer;
  border: 0;
}

.vol-slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  cursor: pointer;
  border: 0;
}

.mode-text {
  font-size: 12px;
  line-height: 1;
  color: inherit;
}

/* ── 播放列表 ── */
.playlist {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 216px;
  overflow-y: auto;
  scrollbar-width: none;
}

.playlist::-webkit-scrollbar {
  display: none;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  border-radius: 5px;
  background: transparent;
  padding: 4px 2px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;
}

.track-item:hover {
  background: rgba(58, 70, 84, 0.05);
}

.track-item.active {
  background: rgba(58, 70, 84, 0.08);
}

.trk-idx {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 3px;
  background: rgba(58, 70, 84, 0.06);
  color: #6b7280;
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
}

.track-item.active .trk-idx {
  background: #3a4654;
  color: #f8f9fa;
}

/* ── 播放动效 equalizer ── */
.trk-eq {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1.5px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 3px;
  padding: 2px 2px;
}

.eq-bar {
  display: block;
  width: 2px;
  border-radius: 1px;
  background: #3a4654;
}

.eq-bar:nth-child(1) {
  animation: eq1 1.2s ease-in-out infinite;
}

.eq-bar:nth-child(2) {
  animation: eq2 1.05s ease-in-out infinite;
  animation-delay: -0.2s;
}

.eq-bar:nth-child(3) {
  animation: eq3 0.9s ease-in-out infinite;
  animation-delay: -0.5s;
}

.eq-bar:nth-child(4) {
  animation: eq4 1.1s ease-in-out infinite;
  animation-delay: -0.35s;
}

@keyframes eq1 {
  0%, 100% { height: 12%; }
  30% { height: 55%; }
  55% { height: 28%; }
  80% { height: 75%; }
}

@keyframes eq2 {
  0%, 100% { height: 60%; }
  20% { height: 20%; }
  50% { height: 75%; }
  70% { height: 38%; }
}

@keyframes eq3 {
  0%, 100% { height: 35%; }
  25% { height: 70%; }
  55% { height: 18%; }
  85% { height: 62%; }
}

@keyframes eq4 {
  0%, 100% { height: 50%; }
  15% { height: 22%; }
  45% { height: 72%; }
  80% { height: 32%; }
}

.trk-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.trk-title {
  font-size: 11px;
  font-weight: 580;
  color: #3a4654;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-empty {
  padding: 20px 8px;
  color: #9ca3af;
  text-align: center;
  font-size: 11px;
}

/* ── 隐藏播放器 ── */
.hidden-player {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}
</style>
