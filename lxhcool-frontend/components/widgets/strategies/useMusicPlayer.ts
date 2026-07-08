import type { WidgetStrategy } from './types';
import type { SiteWidget } from '~/entities/widget/model/types';
import { readArray, readString, resolveAssetUrl, readObject } from './shared';
import { requestPublicApi } from '~/shared/api/client';

export function useMusicPlayer(): WidgetStrategy {
  return {
    normalize(config) {
      return {
        defaultTitle: readString(config, 'defaultTitle'),
        defaultArtist: readString(config, 'defaultArtist'),
        cover: resolveAssetUrl(readString(config, 'cover') || readString(config, 'coverUrl')),
        playlist: readArray<Record<string, unknown>>(config, 'playlist'),
        playlistSource: readObject(config, 'playlistSource'),
      };
    },
  };
}

export function useMusicPlayerSetup(widget: Ref<SiteWidget>, apiBaseUrl: string) {
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

  const config = computed(() => widget.value.config ?? {});

  const playlistSource = computed(() => {
    const source = readObject(config.value, 'playlistSource');
    if (!source || readConfigString4(source, 'provider') !== 'netease') return null;
    const url = readConfigString4(source, 'url');
    return url ? { provider: 'netease', url } : null;
  });

  const { data: remotePlaylist } = useAsyncData(
    `widget-music-playlist-${widget.value.id}`,
    () =>
      playlistSource.value?.url
        ? requestPublicApi<{ tracks: Array<Record<string, unknown>> }>(
            `/public/music/netease/playlist?url=${encodeURIComponent(playlistSource.value.url)}`,
          ).catch(() => ({ tracks: [] }))
        : Promise.resolve({ tracks: [] }),
    { watch: [playlistSource] },
  );

  const configuredPlaylist = computed(() =>
    (readArray<Record<string, unknown>>(config.value, 'playlist'))
      .map((t) => normalizeTrack(t, apiBaseUrl))
      .filter((t) => t.audioUrl || t.embedUrl || t.externalUrl),
  );

  const playlist = computed(() =>
    (remotePlaylist.value?.tracks?.length ? remotePlaylist.value.tracks : configuredPlaylist.value)
      .map((t) => normalizeTrack(t, apiBaseUrl))
      .filter((t) => t.audioUrl || t.embedUrl || t.externalUrl),
  );

  const currentTrack = computed(() => playlist.value[playlistIndex.value] ?? null);
  const currentTrackMetadataUrl = computed(
    () => currentTrack.value?.externalUrl || currentTrack.value?.embedUrl || '',
  );

  const { data: currentTrackMetadata } = useAsyncData(
    `widget-music-metadata-${widget.value.id}`,
    () =>
      currentTrackMetadataUrl.value && !currentTrack.value?.cover
        ? requestPublicApi<{ cover: string }>(
            `/public/music/netease/metadata?url=${encodeURIComponent(currentTrackMetadataUrl.value)}`,
          ).catch(() => ({ cover: '' }))
        : Promise.resolve({ cover: '' }),
    { watch: [currentTrackMetadataUrl] },
  );

  const defaultTitle = computed(() => readString(config.value, 'defaultTitle'));
  const defaultArtist = computed(() => readString(config.value, 'defaultArtist'));
  const cover = computed(() =>
    resolveAssetUrl(readString(config.value, 'cover') || readString(config.value, 'coverUrl'), apiBaseUrl),
  );

  const displayTitle = computed(() => currentTrack.value?.title || defaultTitle.value || 'No playlist');
  const displayArtist = computed(() => currentTrack.value?.artist || defaultArtist.value || 'Add music in admin');

  const displayCover = computed(() =>
    resolveAssetUrl(currentTrack.value?.cover, apiBaseUrl) ||
    resolveAssetUrl(currentTrackMetadata.value?.cover, apiBaseUrl) ||
    cover.value || '',
  );

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

  function toggleMusic() { if (!currentTrack.value) return; isPlaying.value = !isPlaying.value; }

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
    playlistIndex.value = index; isPlaying.value = true; isPlaylistOpen.value = false;
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

  watch(() => playlist.value.length, () => {
    if (playlistIndex.value >= playlist.value.length) playlistIndex.value = 0;
  });

  onBeforeUnmount(() => { if (progressTimer) clearInterval(progressTimer); });

  return {
    audioRef, activeEmbedUrl, isPlaying, isPlaylistOpen, playlistIndex,
    progressRatio, currentTimeLabel, durationLabel,
    playlist, currentTrack, displayTitle, displayArtist, displayCover,
    toggleMusic, playPreviousTrack, playNextTrack, selectPlaylistTrack,
    updateAudioProgress, formatTime,
  };
}

function normalizeTrack(track: Record<string, unknown>, baseUrl: string) {
  const title = readString(track, 'title') || 'Music';
  const artist = readString(track, 'artist') || 'Unknown artist';
  const audioUrl = resolveAssetUrl(readString(track, 'audioUrl'), baseUrl);
  const embedUrl = readString(track, 'embedUrl');
  const externalUrl = readString(track, 'externalUrl');
  const cover = resolveAssetUrl(readString(track, 'cover') || readString(track, 'coverUrl'), baseUrl);
  const rawDuration = track.duration;
  const duration = typeof rawDuration === 'number' ? rawDuration : Number(rawDuration || 0);
  return {
    id: audioUrl || embedUrl || externalUrl || `${title}-${artist}`,
    title, artist, cover, audioUrl, embedUrl, externalUrl,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
  };
}

function readConfigString4(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function formatTime(value: number) {
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
