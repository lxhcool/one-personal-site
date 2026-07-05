<script setup lang="ts">
import { Heart, MessageCircle } from '@lucide/vue';
import { listPublicPosts } from '~/entities/post/api/postApi';
import { listPublicProjects } from '~/entities/project/api/projectApi';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';
import MomentMusicCard from '~/components/moments/MomentMusicCard.vue';

const { apiBaseUrl } = getRequiredPublicRuntimeConfig();
const { data: homeData } = await useAsyncData('home', async () => {
  const [posts, projects] = await Promise.all([
    listPublicPosts('MOMENT'),
    listPublicProjects({ featured: true }),
  ]);
  return { posts, projects };
});

const home = computed(() => {
  if (!homeData.value) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load home data' });
  }

  return homeData.value;
});

function resolveAssetUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  return `${apiBaseUrl}${url}`;
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
  return readMediaString(media, 'audioUrl') ||
    readMediaString(media, 'artist') ||
    readMediaString(media, 'embedUrl')
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
  if (!value) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
</script>

<template>
  <main class="home-page">
    <section class="moments-profile">
      <img class="moments-cover" src="/images/moments-cover.jpg" alt="" />
      <div class="moments-owner">
        <strong>lxhcoool</strong>
        <img src="/images/profile-avatar.jpg" alt="" />
      </div>
    </section>

    <section class="moment-feed">
      <article v-if="home.posts.length === 0" class="empty-card">
        还没有动态
      </article>

      <article v-for="post in home.posts" :key="post.id" class="moment-card">
        <img class="feed-avatar" src="/images/profile-avatar.jpg" alt="" />
        <div class="moment-body">
          <header class="moment-header">
            <span class="author-name">lxhcoool</span>
          </header>

          <p class="moment-text">{{ post.title }}</p>

          <div
            v-if="readMediaStringArray(post.media, 'photos').length > 0"
            :class="[
              'photo-grid',
              readMediaStringArray(post.media, 'photos').length === 1 ? 'is-single' : '',
            ]"
          >
            <img
              v-for="photo in readMediaStringArray(post.media, 'photos')"
              :key="photo"
              :src="resolveAssetUrl(photo)"
              alt=""
            />
          </div>

          <MomentMusicCard
            v-if="readMediaString(getMomentMusic(post.media), 'audioUrl') || readMediaString(getMomentMusic(post.media), 'embedUrl') || readMediaString(getMomentMusic(post.media), 'externalUrl')"
            :music="getMomentMusic(post.media)"
            :fallback-photo="readMediaStringArray(post.media, 'photos')[0]"
          />

          <section
            v-if="readMediaString(getMomentVideo(post.media), 'videoUrl') || readMediaString(getMomentVideo(post.media), 'embedUrl') || readMediaString(getMomentVideo(post.media), 'externalUrl')"
            class="video-card"
          >
            <strong>{{ readMediaString(getMomentVideo(post.media), 'title') || '??' }}</strong>
            <video
              v-if="readMediaString(getMomentVideo(post.media), 'videoUrl')"
              :src="resolveAssetUrl(readMediaString(getMomentVideo(post.media), 'videoUrl'))"
              controls
              preload="metadata"
            />
            <iframe
              v-else-if="readMediaString(getMomentVideo(post.media), 'embedUrl')"
              :src="resolveVideoEmbedUrl(readMediaString(getMomentVideo(post.media), 'embedUrl'))"
              title="Video player"
              loading="lazy"
              frameborder="0"
              allow="fullscreen; encrypted-media; picture-in-picture"
              allowfullscreen
            />
          </section>

          <footer class="moment-actions">
            <time v-if="post.publishedAt" :datetime="post.publishedAt">
              {{ formatDate(post.publishedAt) }}
            </time>
            <div class="action-buttons">
              <button type="button" aria-label="Like">
                <Heart :size="15" stroke-width="2" />
              </button>
              <button type="button" aria-label="Comment">
                <MessageCircle :size="15" stroke-width="2" />
              </button>
            </div>
          </footer>
        </div>
      </article>
    </section>

    <section v-if="home.projects.length > 0" class="project-strip">
      <h2>Featured Projects</h2>
      <ul>
        <li v-for="project in home.projects" :key="project.id">
          <NuxtLink :to="`/projects/${project.slug}`">{{ project.title }}</NuxtLink>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  display: grid;
  gap: 28px;
}

.moments-profile {
  position: relative;
  margin: -24px -24px 10px;
  height: 310px;
  min-height: 310px;
  max-height: 310px;
  border-radius: 12px 12px 0 0;
  background: #eef1f5;
  flex-shrink: 0;
}

.moments-profile::after {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.46) 0%, rgba(0, 0, 0, 0.16) 44%, rgba(0, 0, 0, 0.5) 100%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0) 48%);
  content: '';
  pointer-events: none;
}

.moments-cover {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.moments-owner {
  position: absolute;
  right: 24px;
  bottom: -34px;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.moments-owner strong {
  margin-top: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.moments-owner img {
  width: 76px;
  height: 76px;
  opacity: 1;
  border: 3px solid #fff;
  border-radius: 8px;
  background: #fff;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.16);
}

.moment-feed {
  display: grid;
  gap: 0;
  background: var(--card-bg, #fff);
}

.empty-card {
  border-radius: 8px;
  background: var(--card-bg, #fff);
  box-shadow: var(--card-shadow, 0px 8px 24px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0px rgba(0, 0, 0, 0.02));
}

.empty-card {
  padding: 24px;
  color: var(--text-muted, #667085);
  text-align: center;
}

.moment-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  padding: 14px 0 0;
  background: var(--card-bg, #fff);
}

.feed-avatar {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  object-fit: cover;
}

.moment-header {
  display: block;
}

.moment-body {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid #eef0f3;
}

.author-name {
  color: #576b95;
  font-weight: 700;
}

.moment-text {
  margin: 0;
  color: var(--text-main, #1f2937);
  line-height: 1.65;
  white-space: pre-wrap;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.photo-grid.is-single {
  grid-template-columns: 1fr;
}

.photo-grid img {
  aspect-ratio: 1 / 1;
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.photo-grid.is-single img {
  aspect-ratio: 4 / 3;
}

.video-card {
  display: grid;
  gap: 8px;
}

.video-card strong {
  color: var(--text-main, #1f2937);
}

.video-card video,
.video-card iframe {
  aspect-ratio: 16 / 9;
  width: 100%;
  border-radius: 8px;
  background: #000;
}

.moment-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 2px;
  color: #8a94a6;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  border-radius: 4px;
  background: #f5f6f8;
  color: #576b95;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  padding: 6px 8px;
}

.action-buttons button:hover {
  background: #eef1f6;
}

.project-strip {
  padding: 18px;
  border-radius: 8px;
  background: var(--card-bg, #fff);
  box-shadow: var(--card-shadow, 0px 8px 24px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0px rgba(0, 0, 0, 0.02));
}

@media (max-width: 680px) {
  .moments-profile {
    margin: -24px -24px 4px;
    height: 260px;
    min-height: 260px;
    max-height: 260px;
    border-radius: 10px 10px 0 0;
  }

  .moments-owner {
    right: 16px;
    bottom: -30px;
    gap: 10px;
  }

  .moments-owner strong {
    font-size: 16px;
  }

  .moments-owner img {
    width: 66px;
    height: 66px;
  }

  .moment-card {
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 9px;
  }

  .feed-avatar {
    width: 38px;
    height: 38px;
  }
}
</style>
