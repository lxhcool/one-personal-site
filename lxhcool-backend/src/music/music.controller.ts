import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';

@Controller('admin/music')
@UseGuards(AdminAuthGuard)
export class MusicController {
  @Get('netease/metadata')
  async getNeteaseMetadata(@Query('url') url: string) {
    return getNeteaseMetadata(url);
  }

  @Get('netease/playlist')
  async getNeteasePlaylist(@Query('url') url: string) {
    return getNeteasePlaylist(url);
  }
}

@Controller('public/music')
export class PublicMusicController {
  @Get('netease/metadata')
  async getNeteaseMetadata(@Query('url') url: string) {
    return getNeteaseMetadata(url);
  }

  @Get('netease/playlist')
  async getNeteasePlaylist(@Query('url') url: string) {
    return getNeteasePlaylist(url);
  }
}

async function getNeteaseMetadata(url: string) {
    const id = extractNeteaseSongId(url);
    if (!id) {
      throw new BadRequestException('Invalid NetEase Music song URL');
    }

    const response = await fetch(
      `https://music.163.com/api/song/detail/?ids=[${encodeURIComponent(id)}]`,
      {
        headers: {
          Referer: 'https://music.163.com/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        },
      },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch NetEase Music metadata');
    }

    const body = (await response.json()) as {
      songs?: Array<{
        name?: string;
        artists?: Array<{ name?: string }>;
        album?: { picUrl?: string };
        duration?: number;
        dt?: number;
      }>;
    };
    const song = body.songs?.[0];
    if (!song) {
      throw new BadRequestException('NetEase Music song not found');
    }

    return ok({
      id,
      title: song.name ?? '',
      artist: song.artists?.map((artist) => artist.name).filter(Boolean).join(' / ') ?? '',
      cover: song.album?.picUrl ?? '',
      duration: readSongDuration(song),
    });
}

async function getNeteasePlaylist(url: string) {
  const id = extractNeteasePlaylistId(url);
  if (!id) {
    throw new BadRequestException('Invalid NetEase Music playlist URL');
  }

  const playlistResponse = await fetch(
    `https://music.163.com/api/v6/playlist/detail?id=${encodeURIComponent(id)}&n=100000&s=8`,
    { headers: neteaseHeaders() },
  );

  if (!playlistResponse.ok) {
    throw new BadRequestException('Failed to fetch NetEase Music playlist');
  }

  const playlistBody = (await playlistResponse.json()) as {
    result?: {
      name?: string;
      coverImgUrl?: string;
      tracks?: Array<NeteaseSong>;
      trackIds?: Array<{ id?: number | string }>;
    };
    playlist?: {
      name?: string;
      coverImgUrl?: string;
      tracks?: Array<NeteaseSong>;
      trackIds?: Array<{ id?: number | string }>;
    };
  };
  const playlist = playlistBody.result ?? playlistBody.playlist;
  const ids = (playlist?.trackIds ?? [])
    .map((track) => track.id)
    .filter((trackId): trackId is number | string => trackId !== undefined && trackId !== null && trackId !== '');
  let tracks = ids.length > 0 ? await getNeteaseSongs(ids) : (playlist?.tracks ?? []);

  if (ids.length > 0 && tracks.length > 0) {
    const order = new Map(ids.map((trackId, index) => [String(trackId), index]));
    tracks = [...tracks].sort(
      (a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0),
    );
  }

  if (tracks.length === 0) {
    throw new BadRequestException('NetEase Music playlist not found');
  }

  return ok({
    id,
    title: playlist?.name ?? '',
    cover: playlist?.coverImgUrl ?? '',
    trackCount: ids.length || tracks.length,
    tracks: tracks.map(formatNeteaseSong).filter((track) => track.id),
  });
}

type NeteaseSong = {
  id?: number | string;
  name?: string;
  artists?: Array<{ name?: string }>;
  ar?: Array<{ name?: string }>;
  album?: { picUrl?: string };
  al?: { picUrl?: string };
  duration?: number;
  dt?: number;
};

async function getNeteaseSongs(ids: Array<number | string>) {
  const chunks = chunk(ids, 200);
  const results = await Promise.all(
    chunks.map(async (chunkIds) => {
      const response = await fetch(
        `https://music.163.com/api/song/detail/?ids=[${chunkIds.map((id) => encodeURIComponent(String(id))).join(',')}]`,
        { headers: neteaseHeaders() },
      );

      if (!response.ok) return [];
      const body = (await response.json()) as { songs?: NeteaseSong[] };
      return body.songs ?? [];
    }),
  );

  return results.flat();
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function formatNeteaseSong(song: NeteaseSong) {
  const id = song.id ? String(song.id) : '';
  const artistSource = song.artists ?? song.ar ?? [];
  return {
    id,
    title: song.name ?? '',
    artist: artistSource.map((artist) => artist.name).filter(Boolean).join(' / '),
    cover: song.album?.picUrl ?? song.al?.picUrl ?? '',
    duration: readSongDuration(song),
    externalUrl: id ? `https://music.163.com/#/song?id=${id}` : '',
    embedUrl: id ? `https://music.163.com/outchain/player?type=2&id=${id}&auto=0&height=66` : '',
  };
}

function readSongDuration(song: { duration?: number; dt?: number }) {
  const duration = song.duration ?? song.dt ?? 0;
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration / 1000) : 0;
}

function neteaseHeaders() {
  return {
    Referer: 'https://music.163.com/',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  };
}

function extractNeteaseSongId(url: string) {
  return url.match(/[?&#]id=(\d+)/)?.[1] ?? url.match(/song\/(\d+)/)?.[1];
}

function extractNeteasePlaylistId(url: string) {
  return url.match(/[?&#]id=(\d+)/)?.[1] ?? url.match(/playlist\/(\d+)/)?.[1];
}
