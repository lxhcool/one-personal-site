import { listPublicWidgets } from '~/entities/widget/api/widgetApi';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';
import { requestPublicApi } from '~/shared/api/client';
import { readArray, readString, readObject, resolveAssetUrl } from '~/components/widgets/strategies/shared';

// ── helpers ──
function readConfigString4(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

export function formatTime(value: number) {
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

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  embedUrl: string;
  externalUrl: string;
  duration: number;
}

function normalizeTrack(track: Record<string, unknown>, baseUrl: string): Track {
  const title = readString(track, 'title') || 'Music';
  const artist = readString(track, 'artist') || 'Unknown artist';
  const audioUrl = resolveAssetUrl(readString(track, 'audioUrl'), baseUrl);
  const embedUrl = readString(track, 'embedUrl');
  const externalUrl = readString(track, 'externalUrl');
  const cover = resolveAssetUrl(readString(track, 'cover') || readString(track, 'coverUrl'), baseUrl);
  const rawDuration = track.duration;
  const duration = typeof rawDuration === 'number' ? rawDuration : Number(rawDuration || 0);
  return {
    id: `${title}-${artist}`,
    title, artist, cover, audioUrl, embedUrl, externalUrl,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
  };
}

// ── composable ──
export function useStandaloneMusicPlayer() {
  const { apiBaseUrl } = getRequiredPublicRuntimeConfig();

  // ---- 获取音乐 widget 配置（复用布局层已 fetch 的 public-widgets 数据，避免重复请求） ----
  const { status, data: widgetsData } = useAsyncData('public-widgets', () => listPublicWidgets());

  const widgetConfig = computed(() => {
    const musicWidget = (widgetsData.value ?? []).find((w) => w.type === 'MUSIC_PLAYER');
    return (musicWidget?.config ?? {}) as Record<string, unknown>;
  });

  const widgetId = computed(() => {
    const musicWidget = (widgetsData.value ?? []).find((w) => w.type === 'MUSIC_PLAYER');
    return musicWidget?.id ?? '__music__';
  });

  // ---- 网易云歌单来源 ----
  const playlistSource = computed(() => {
    const source = readObject(widgetConfig.value, 'playlistSource');
    if (!source || readConfigString4(source, 'provider') !== 'netease') return null;
    const url = readConfigString4(source, 'url');
    return url ? { provider: 'netease' as const, url } : null;
  });

  // ---- 远程歌单 ----
  const { data: remotePlaylist } = useAsyncData(
    'standalone-music-playlist',
    () =>
      playlistSource.value?.url
        ? requestPublicApi<{ tracks: Array<Record<string, unknown>> }>(
            `/public/music/netease/playlist?url=${encodeURIComponent(playlistSource.value.url)}`,
          ).catch(() => ({ tracks: [] }))
        : Promise.resolve({ tracks: [] }),
    { watch: [playlistSource] },
  );

  // ---- 本地配置播放列表 ----
  const configuredPlaylist = computed<Track[]>(() =>
    (readArray<Record<string, unknown>>(widgetConfig.value, 'playlist'))
      .map((t) => normalizeTrack(t, apiBaseUrl))
      .filter((t) => t.audioUrl || t.embedUrl || t.externalUrl),
  );

  // ---- 最终播放列表（远程优先） ----
  const playlist = computed<Track[]>(() => {
    const remote = remotePlaylist.value?.tracks;
    return (remote?.length ? remote : configuredPlaylist.value).map((t) =>
      normalizeTrack(t as Record<string, unknown>, apiBaseUrl),
    );
  });

  // ---- 默认值 ----
  const defaultTitle = computed(() => readString(widgetConfig.value, 'defaultTitle'));
  const defaultArtist = computed(() => readString(widgetConfig.value, 'defaultArtist'));

  // ========== 播放模式 ==========
  type PlayMode = 'sequential' | 'shuffle' | 'repeat' | 'repeat-one';
  const playMode = ref<PlayMode>('sequential');
  const volume = ref(0.4);
  const isMuted = ref(false);

  // Web Audio API
  let audioCtx: AudioContext | null = null;
  let gainNode: GainNode | null = null;

  async function ensureAudioContext() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
      gainNode = audioCtx.createGain();
      gainNode.connect(audioCtx.destination);
      gainNode.gain.value = isMuted.value ? 0 : volume.value;
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
  }

  async function connectAudioToGain(audio: HTMLAudioElement) {
    await ensureAudioContext();
    if (!audioCtx || !gainNode) return;
    try {
      const source = audioCtx.createMediaElementSource(audio);
      source.connect(gainNode);
    } catch {
      // already connected or not supported
    }
  }

  const playModeLabel = computed(() => {
    const map: Record<PlayMode, string> = { sequential: '顺序', shuffle: '随机', repeat: '循环', 'repeat-one': '单曲' };
    return map[playMode.value];
  });

  function togglePlayMode() {
    const modes: PlayMode[] = ['sequential', 'shuffle', 'repeat', 'repeat-one'];
    const idx = modes.indexOf(playMode.value);
    playMode.value = modes[(idx + 1) % modes.length];
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v));
    isMuted.value = volume.value === 0;
    if (gainNode) gainNode.gain.value = volume.value;
    if (audioRef.value) audioRef.value.volume = volume.value;
  }

  function toggleMute() {
    isMuted.value = !isMuted.value;
    const targetVol = isMuted.value ? 0 : volume.value;
    if (gainNode) gainNode.gain.value = targetVol;
    if (audioRef.value) audioRef.value.volume = targetVol;
  }

  // ========== 播放状态 ==========
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

  // 随机可用的历史记录（避免连续随机到同一首）
  const shuffleHistory: number[] = [];

  const currentTrack = computed(() => playlist.value[playlistIndex.value] ?? null);

  const currentTrackMetadataUrl = computed(
    () => currentTrack.value?.externalUrl || currentTrack.value?.embedUrl || '',
  );

  const { data: currentTrackMetadata } = useAsyncData(
    'standalone-music-metadata',
    () =>
      currentTrackMetadataUrl.value && !currentTrack.value?.cover
        ? requestPublicApi<{ cover: string }>(
            `/public/music/netease/metadata?url=${encodeURIComponent(currentTrackMetadataUrl.value)}`,
          ).catch(() => ({ cover: '' }))
        : Promise.resolve({ cover: '' }),
    { watch: [currentTrackMetadataUrl] },
  );

  const displayTitle = computed(() => currentTrack.value?.title || defaultTitle.value || 'No playlist');
  const displayArtist = computed(() => currentTrack.value?.artist || defaultArtist.value || 'Add music in admin');

  // ── 进度管理 ──
  function resetProgress() {
    simulatedCurrentTime.value = 0;
    progressRatio.value = 0;
    currentTimeLabel.value = '0:00';
    durationLabel.value = currentTrack.value?.duration ? formatTime(currentTrack.value.duration) : '0:00';
  }

  function syncProgressTimer() {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = undefined; }
    const track = currentTrack.value;
    if (!isPlaying.value || !track || track.audioUrl || !track.duration) return;
    durationLabel.value = formatTime(track.duration);
    progressTimer = setInterval(() => {
      simulatedCurrentTime.value = Math.min(simulatedCurrentTime.value + 1, track.duration || 0);
      progressRatio.value = track.duration ? simulatedCurrentTime.value / track.duration : 0;
      currentTimeLabel.value = formatTime(simulatedCurrentTime.value);
      durationLabel.value = formatTime(track.duration || 0);
      if (track.duration && simulatedCurrentTime.value >= track.duration) playNextTrack();
    }, 1000);
  }

  async function syncMusicPlayback() {
    const track = currentTrack.value;
    if (!track) { activeEmbedUrl.value = ''; isPlaying.value = false; syncProgressTimer(); return; }
    if (track.audioUrl && audioRef.value) {
      activeEmbedUrl.value = '';
      if (isPlaying.value) await audioRef.value.play(); else audioRef.value.pause();
      syncProgressTimer(); return;
    }
    if (track.embedUrl) {
      activeEmbedUrl.value = isPlaying.value ? withAutoplay(track.embedUrl) : '';
      syncProgressTimer();
    }
  }

  // ── 控制方法 ──
  async function toggleMusic() {
    if (!currentTrack.value) return;
    await ensureAudioContext();
    isPlaying.value = !isPlaying.value;
  }

  function playPreviousTrack() {
    if (playlist.value.length === 0) return;
    if (playMode.value === 'repeat-one') {
      playlistIndex.value = playlistIndex.value;
    } else if (playMode.value === 'shuffle') {
      const next = getShuffleIndex();
      playlistIndex.value = next < 0 ? (playlistIndex.value - 1 + playlist.value.length) % playlist.value.length : next;
    } else {
      playlistIndex.value = (playlistIndex.value - 1 + playlist.value.length) % playlist.value.length;
    }
    isPlaying.value = true;
  }

  function getShuffleIndex(): number {
    const len = playlist.value.length;
    if (len <= 1) return -1;
    const available = Array.from({ length: len }, (_, i) => i).filter((i) => i !== playlistIndex.value);
    // 避免重复最近两首
    const recent = shuffleHistory.slice(-2);
    const candidates = available.filter((i) => !recent.includes(i));
    const pool = candidates.length > 0 ? candidates : available;
    const idx = pool[Math.floor(Math.random() * pool.length)];
    shuffleHistory.push(idx);
    if (shuffleHistory.length > 10) shuffleHistory.shift();
    return idx;
  }

  function playNextTrack() {
    if (playlist.value.length === 0) return;
    if (playMode.value === 'repeat-one') {
      playlistIndex.value = playlistIndex.value;
    } else if (playMode.value === 'shuffle') {
      const next = getShuffleIndex();
      if (next >= 0) playlistIndex.value = next;
    } else if (playMode.value === 'repeat') {
      playlistIndex.value = (playlistIndex.value + 1) % playlist.value.length;
    } else {
      // sequential: 播完最后一首停止
      if (playlistIndex.value >= playlist.value.length - 1) {
        playlistIndex.value = 0;
        isPlaying.value = false;
        return;
      }
      playlistIndex.value = playlistIndex.value + 1;
    }
    isPlaying.value = true;
  }

  function selectPlaylistTrack(index: number) {
    playlistIndex.value = index; isPlaying.value = true; isPlaylistOpen.value = false;
  }

  function seekTo(ratio: number) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const audio = audioRef.value;
    if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = clamped * audio.duration;
      progressRatio.value = clamped;
      currentTimeLabel.value = formatTime(audio.currentTime);
    }
  }

  function updateAudioProgress() {
    const audio = audioRef.value;
    if (!audio) return;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    progressRatio.value = duration > 0 ? Math.min(audio.currentTime / duration, 1) : 0;
    currentTimeLabel.value = formatTime(audio.currentTime);
    durationLabel.value = duration > 0 ? formatTime(duration) : '0:00';
  }

  watch(
    () => [isPlaying.value, currentTrack.value?.id],
    () => { resetProgress(); void syncMusicPlayback(); syncProgressTimer(); },
    { flush: 'post' },
  );

  // 音量同步
  function syncVolume() {
    const targetVol = isMuted.value ? 0 : volume.value;
    if (gainNode) gainNode.gain.value = targetVol;
    if (audioRef.value) audioRef.value.volume = targetVol;
  }
  watch(audioRef, (el) => {
    if (el) {
      el.volume = isMuted.value ? 0 : volume.value;
      void connectAudioToGain(el);
    }
  });
  watch([volume, isMuted], () => syncVolume());

  watch(() => playlist.value.length, () => {
    if (playlistIndex.value >= playlist.value.length) playlistIndex.value = 0;
  });

  onBeforeUnmount(() => {
    if (progressTimer) clearInterval(progressTimer);
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; gainNode = null; }
  });

  const isLoading = computed(() => status.value === 'pending');

  return {
    audioRef, activeEmbedUrl, isPlaying, isPlaylistOpen, playlistIndex,
    progressRatio, currentTimeLabel, durationLabel,
    playlist, currentTrack, displayTitle, displayArtist,
    isLoading,
    playMode, playModeLabel, volume, isMuted,
    toggleMusic, playPreviousTrack, playNextTrack, selectPlaylistTrack,
    togglePlayMode, setVolume, toggleMute,
    updateAudioProgress, seekTo, formatTime,
  };
}
