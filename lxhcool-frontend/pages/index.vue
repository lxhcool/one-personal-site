<script setup lang="ts">
import { listPublicPosts } from '~/entities/post/api/postApi';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';
import { createThumbnailUrl, resolvePublicImageUrl } from '~/shared/media/imageSources';
import MomentMusicCard from '~/components/moments/MomentMusicCard.vue';

const { publicApiBaseUrl } = getRequiredPublicRuntimeConfig();
const { open: openImagePreview } = useImagePreview();
const { data: postsData } = await useAsyncData('home-moments', () => listPublicPosts('MOMENT'));

const posts = computed(() => {
  if (!postsData.value) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load moments' });
  }
  return postsData.value;
});

function resolveAssetUrl(url?: string | null) {
  if (!url) return undefined;
  return resolvePublicImageUrl(url, publicApiBaseUrl);
}

function getMomentPhotos(media: Record<string, unknown>, title?: string | null) {
  return readMediaStringArray(media, 'photos').map((photo) => ({
    src: resolvePublicImageUrl(photo, publicApiBaseUrl),
    thumbnail: createThumbnailUrl(photo, publicApiBaseUrl, { width: 240, height: 240, fit: 'cover' }),
    alt: title || '',
  }));
}

function readMediaObject(media: Record<string, unknown>, key: string) {
  const value = media[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getMomentMusic(media: Record<string, unknown>) {
  const nested = readMediaObject(media, 'music');
  if (Object.keys(nested).length > 0) return nested;
  return readMediaString(media, 'audioUrl') || readMediaString(media, 'artist') || readMediaString(media, 'embedUrl')
    ? media
    : {};
}

function getMomentVideo(media: Record<string, unknown>) {
  const nested = readMediaObject(media, 'video');
  if (Object.keys(nested).length > 0) return nested;
  return readMediaString(media, 'videoUrl') || readMediaString(media, 'source') === 'bilibili'
    ? media
    : {};
}

function readMediaString(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function readMediaStringArray(media: Record<string, unknown>, key: string) {
  const value = media[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function resolveVideoEmbedUrl(url?: string | null) {
  if (!url) return '';
  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set('autoplay', '0');
    return nextUrl.toString();
  } catch {
    return url.includes('?') ? `${url}&autoplay=0` : `${url}?autoplay=0`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'unknown-time';
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
</script>

<template>
  <main>
    <WorkbenchWindow path="~/moments" :status="`${posts.length} logs`">
      <section class="terminal-feed" aria-label="动态日志">
        <header class="terminal-session">
          <p class="terminal-line terminal-muted">Last sync: {{ formatDate(new Date().toISOString()) }}</p>
          <p class="terminal-line"><span class="prompt">~/moments $</span> tail -f moments.log</p>
        </header>

        <div v-if="posts.length" class="log-list">
          <article v-for="post in posts" :key="post.id" class="log-entry">
            <header class="log-meta">
              <time :datetime="post.publishedAt || post.createdAt">[{{ formatDate(post.publishedAt || post.createdAt) }}]</time>
              <span>{{ post.category || 'moment' }}</span>
            </header>

            <h2 v-if="post.title">{{ post.title }}</h2>

            <div
              v-if="getMomentPhotos(post.media, post.title).length"
              class="log-photos"
            >
              <button
                v-for="(photo, photoIndex) in getMomentPhotos(post.media, post.title)"
                :key="photo.src"
                type="button"
                :aria-label="`预览图片 ${photoIndex + 1}`"
                @click="openImagePreview(getMomentPhotos(post.media, post.title), photoIndex)"
              >
                <img
                  :src="photo.thumbnail"
                  :alt="photo.alt"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </div>

            <MomentMusicCard
              v-if="readMediaString(getMomentMusic(post.media), 'audioUrl') || readMediaString(getMomentMusic(post.media), 'embedUrl') || readMediaString(getMomentMusic(post.media), 'externalUrl')"
              :music="getMomentMusic(post.media)"
              :fallback-photo="readMediaStringArray(post.media, 'photos')[0]"
            />

            <div
              v-if="readMediaString(getMomentVideo(post.media), 'videoUrl') || readMediaString(getMomentVideo(post.media), 'embedUrl')"
              class="log-video"
            >
              <video
                v-if="readMediaString(getMomentVideo(post.media), 'videoUrl')"
                :src="resolveAssetUrl(readMediaString(getMomentVideo(post.media), 'videoUrl'))"
                controls
                preload="metadata"
              />
              <iframe
                v-else
                :src="resolveVideoEmbedUrl(readMediaString(getMomentVideo(post.media), 'embedUrl'))"
                title="视频播放器"
                loading="lazy"
                frameborder="0"
                allow="fullscreen; encrypted-media; picture-in-picture"
                allowfullscreen
              />
            </div>

          </article>
        </div>

        <p v-else class="terminal-empty">moments.log is empty</p>

        <p class="terminal-line terminal-cursor" aria-hidden="true">
          <span class="prompt">~/moments $</span><span class="cursor-block" />
        </p>
      </section>
    </WorkbenchWindow>
  </main>
</template>

<style scoped>
.terminal-feed {
  color: #46535c;
  font-family: 'IBM Plex Mono', 'Cascadia Code', monospace;
  font-size: 11px;
  line-height: 1.72;
}

.terminal-session {
  padding-bottom: 18px;
  border-bottom: 1px dashed rgba(89, 78, 62, 0.16);
}

.terminal-line { margin: 0; }
.terminal-line + .terminal-line { margin-top: 3px; }
.terminal-muted { color: #90979a; }
.prompt { margin-right: 8px; color: #328066; font-weight: 700; }

.log-entry {
  padding: 16px 0;
  border-bottom: 1px dashed rgba(89, 78, 62, 0.22);
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 9px;
  color: #8b9397;
  font-size: 8px;
  text-transform: uppercase;
}

.log-meta span { color: #328066; }
.log-entry h2 { margin: 0; color: #35414a; font-family: Apfel Grotezk, sans-serif; font-size: 16px; letter-spacing: -0.025em; line-height: 1.35; }

.log-photos {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  gap: 4px;
  width: fit-content;
  max-width: 100%;
  margin-top: 15px;
}

.log-photos button {
  display: block;
  width: 100px;
  height: 100px;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: rgba(105, 91, 72, 0.08);
  cursor: zoom-in;
}

.log-photos img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 150ms ease;
}

.log-photos button:hover img { transform: scale(1.035); }

.terminal-feed :deep(.moment-music-card) {
  margin-top: 15px;
}

.log-video { width: 360px; max-width: 100%; aspect-ratio: 16 / 9; margin-top: 15px; overflow: hidden; border-radius: 5px; background: #252b2f; }
.log-video video,
.log-video iframe { display: block; width: 100%; height: 100%; border: 0; }
.log-video video { object-fit: cover; }

.terminal-empty { margin: 0; padding: 55px 0; color: #8b9397; text-align: center; }
.terminal-cursor { margin-top: 20px; }
.cursor-block { display: inline-block; width: 6px; height: 11px; background: #328066; vertical-align: -2px; animation: cursor-blink 1s step-end infinite; }

@keyframes cursor-blink { 50% { opacity: 0; } }

@media (max-width: 560px) {
  .terminal-feed { font-size: 10px; }
  .log-entry { padding-block: 14px; }
  .log-photos { grid-template-columns: repeat(2, 100px); }
}

@media (prefers-reduced-motion: reduce) {
  .cursor-block { animation: none; }
}
</style>
