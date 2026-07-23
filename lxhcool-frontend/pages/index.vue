<script setup lang="ts">
import { listPublicPosts } from '~/entities/post/api/postApi';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';
import { createThumbnailUrl, resolvePublicImageUrl } from '~/shared/media/imageSources';
import MomentMusicCard from '~/components/moments/MomentMusicCard.vue';
import type { AdminUser } from '~/entities/admin-user/model/types';

const { publicApiBaseUrl } = getRequiredPublicRuntimeConfig();
const { open: openImagePreview } = useImagePreview();
const { data: postsData } = await useAsyncData('home-moments', () => listPublicPosts('MOMENT'));
const { data: currentUser } = useNuxtData<AdminUser | null>('current-user');
const authorName = computed(() => currentUser.value?.name?.trim() || 'lxhcool');
const authorAvatar = computed(() => resolveAssetUrl(currentUser.value?.avatar) || '/images/default-avatar.jpg');

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
  const photos = readMediaStringArray(media, 'photos');
  const singlePhoto = photos.length === 1;
  return photos.slice(0, 9).map((photo) => ({
    src: resolvePublicImageUrl(photo, publicApiBaseUrl),
    thumbnail: createThumbnailUrl(photo, publicApiBaseUrl, singlePhoto
      ? { width: 720, fit: 'inside' }
      : { width: 240, height: 240, fit: 'cover' }),
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
  if (!value) return '刚刚';
  const date = new Date(value);
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
</script>

<template>
  <main>
    <WorkbenchWindow class="moments-window" path="~/moments" :status="`${posts.length} 条动态`">
      <section class="moments-feed" aria-label="最近动态">
        <header class="moment-index">
          <div>
            <span>RECENT MOMENTS</span>
            <strong>生活与开发的片段</strong>
          </div>
          <small>{{ String(posts.length).padStart(2, '0') }} entries</small>
        </header>

        <div v-if="posts.length" class="moment-list">
          <article v-for="post in posts" :key="post.id" class="moment-entry">
            <img class="moment-avatar" :src="authorAvatar" :alt="authorName" />

            <div class="moment-body">
              <header class="moment-author">
                <strong>{{ authorName }}</strong>
                <time :datetime="post.publishedAt || post.createdAt">
                  {{ formatDate(post.publishedAt || post.createdAt) }}
                </time>
              </header>

              <p v-if="post.title" class="moment-copy">{{ post.title }}</p>

            <div
              v-if="getMomentPhotos(post.media, post.title).length"
                class="moment-photos"
                :class="`photo-count-${Math.min(getMomentPhotos(post.media, post.title).length, 9)}`"
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
                class="moment-music"
                :fallback-photo="readMediaStringArray(post.media, 'photos')[0]"
            />

            <div
              v-if="readMediaString(getMomentVideo(post.media), 'videoUrl') || readMediaString(getMomentVideo(post.media), 'embedUrl')"
                class="moment-video"
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

            </div>
          </article>
        </div>

        <p v-else class="moment-empty">还没有发布动态</p>
      </section>
    </WorkbenchWindow>
  </main>
</template>

<style scoped>
.moments-feed {
  width: 100%;
  max-width: none;
}

.moments-window :deep(.window-content) {
  padding: 18px 22px 24px;
}

.moment-index {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  padding: 2px 0 15px;
  border-bottom: 1px dashed rgba(11, 15, 19, 0.1);
  font-family: 'IBM Plex Mono', monospace;
}

.moment-index > div {
  display: grid;
  gap: 3px;
}

.moment-index span {
  color: #4d9a75;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.11em;
}

.moment-index strong {
  color: #45515a;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.moment-index small {
  color: #939ca2;
  font-size: 8px;
  white-space: nowrap;
}

.moment-entry {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 11px;
  padding: 17px 0 18px;
}

.moment-entry + .moment-entry {
  border-top: 1px dashed rgba(11, 15, 19, 0.075);
}

.moment-avatar {
  display: block;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(11, 15, 19, 0.06);
  border-radius: 6px;
  object-fit: cover;
}

.moment-body { min-width: 0; }

.moment-author {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 19px;
  font-family: 'IBM Plex Mono', monospace;
}

.moment-author strong {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #47535b;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.moment-author strong::before {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #4d9a75;
  box-shadow: 0 0 0 3px rgba(77, 154, 117, 0.08);
  content: '';
}

.moment-author time {
  color: #9aa2a8;
  font-size: 8px;
}

.moment-copy {
  margin: 5px 0 0;
  color: #38434b;
  font-size: 13.5px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.moment-photos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
  width: fit-content;
  max-width: 330px;
  margin-top: 12px;
}

.moment-photos.photo-count-2,
.moment-photos.photo-count-4 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 220px;
}

.moment-photos.photo-count-1 {
  display: block;
  width: 214px;
  max-width: 100%;
}

.moment-photos button {
  display: block;
  width: 104px;
  aspect-ratio: 1;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: #eef1f3;
  cursor: zoom-in;
}

.moment-photos.photo-count-1 button {
  width: 214px;
  max-width: 100%;
  aspect-ratio: 1;
}

.moment-photos img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 150ms ease;
}

.moment-photos.photo-count-1 img {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  object-fit: cover;
}

.moment-photos button:hover img { transform: scale(1.025); }

.moments-feed :deep(.moment-music-card) { max-width: 312px; margin-top: 10px; }

.moment-video { width: 360px; max-width: 100%; aspect-ratio: 16 / 9; margin-top: 12px; overflow: hidden; border-radius: 6px; background: #252b2f; }
.moment-video video,
.moment-video iframe { display: block; width: 100%; height: 100%; border: 0; }
.moment-video video { object-fit: cover; }

.moment-empty { margin: 0; padding: 70px 0; color: #929ba1; font-size: 12px; text-align: center; }

@media (max-width: 560px) {
  .moments-window :deep(.window-content) { padding: 14px 13px 20px; }
  .moment-index { padding-bottom: 13px; }
  .moment-entry { grid-template-columns: 28px minmax(0, 1fr); gap: 9px; padding: 15px 0; }
  .moment-avatar { width: 28px; height: 28px; border-radius: 5px; }
  .moment-copy { font-size: 13px; }
  .moment-photos { max-width: 272px; }
  .moment-photos.photo-count-2,
  .moment-photos.photo-count-4 { max-width: 181px; }
  .moment-photos.photo-count-1,
  .moment-photos.photo-count-1 button { width: 181px; }
  .moment-photos button { width: 87px; }
}
</style>
