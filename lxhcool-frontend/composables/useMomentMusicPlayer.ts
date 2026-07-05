export type MomentMusicTrack = {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  audioUrl?: string;
  embedUrl?: string;
  externalUrl?: string;
};

export function useMomentMusicPlayer() {
  const current = useState<MomentMusicTrack | null>('moment-music-current', () => null);
  const isPlaying = useState('moment-music-playing', () => false);

  function playTrack(track: MomentMusicTrack) {
    current.value = track;
    isPlaying.value = true;
  }

  function pause() {
    isPlaying.value = false;
  }

  function toggle() {
    if (!current.value) return;
    isPlaying.value = !isPlaying.value;
  }

  return {
    current,
    isPlaying,
    playTrack,
    pause,
    toggle,
  };
}
