<script setup lang="ts">
import { marked } from 'marked';
import { getPublicPost } from '~/entities/post/api/postApi';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';

const route = useRoute();
const slug = String(route.params.slug);
const { apiBaseUrl } = getRequiredPublicRuntimeConfig();
const { data: postData } = await useAsyncData(`public-post-${slug}`, () => getPublicPost(slug));

const post = computed(() => {
  if (!postData.value) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' });
  }

  return postData.value;
});

const renderedContent = computed(() => marked.parse(post.value.content, { async: false }) as string);
const coverImage = computed(() => resolveAssetUrl(post.value.coverImage));
const media = computed(() => post.value.media ?? {});
const photos = computed(() => readMediaStringArray('photos').map(resolveAssetUrl).filter(Boolean));
const music = computed(() => {
  const nested = readMediaObject('music');
  if (Object.keys(nested).length > 0) return nested;
  return readMediaString(media.value, 'audioUrl') || readMediaString(media.value, 'artist') || readMediaString(media.value, 'embedUrl')
    ? media.value
    : {};
});
const video = computed(() => {
  const nested = readMediaObject('video');
  if (Object.keys(nested).length > 0) return nested;
  return readMediaString(media.value, 'videoUrl') || readMediaString(media.value, 'source') === 'bilibili'
    ? media.value
    : {};
});
const musicAudioUrl = computed(() => resolveAssetUrl(readMediaString(music.value, 'audioUrl')));
const musicEmbedUrl = computed(() => readMediaString(music.value, 'embedUrl'));
const musicExternalUrl = computed(() => readMediaString(music.value, 'externalUrl'));
const videoUrl = computed(() => resolveAssetUrl(readMediaString(video.value, 'videoUrl')));
const videoEmbedUrl = computed(() => resolveVideoEmbedUrl(readMediaString(video.value, 'embedUrl')));
const videoExternalUrl = computed(() => readMediaString(video.value, 'externalUrl'));

useSeoMeta({
  title: () => post.value.seoTitle ?? post.value.title,
  description: () => post.value.seoDescription ?? post.value.excerpt ?? undefined,
  ogImage: () => post.value.ogImage ?? coverImage.value ?? photos.value[0] ?? undefined,
});

function resolveAssetUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  return `${apiBaseUrl}${url}`;
}

function readMediaObject(key: string) {
  const value = media.value[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readMediaString(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function readMediaStringArray(key: string) {
  const value = media.value[key];
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
</script>

<template>
  <main>
    <nav>
      <NuxtLink to="/">Home</NuxtLink>
      <NuxtLink to="/blog">Blog</NuxtLink>
    </nav>

    <article>
      <h1>{{ post.title }}</h1>
      <time v-if="post.publishedAt" :datetime="post.publishedAt">{{ post.publishedAt }}</time>

      <template v-if="post.type === 'ARTICLE'">
        <img v-if="coverImage" :src="coverImage" :alt="post.title" />
        <p v-if="post.excerpt">{{ post.excerpt }}</p>
        <div class="post-content" v-html="renderedContent" />
      </template>

      <template v-else>
        <p v-if="post.content" class="moment-text">{{ post.content }}</p>

        <div v-if="photos.length > 0" class="moment-photos">
          <img v-for="photo in photos" :key="photo" :src="photo" alt="" />
        </div>

        <section
          v-if="musicAudioUrl || musicEmbedUrl || musicExternalUrl"
          class="post-media"
        >
          <div class="media-heading">
            <strong>{{ readMediaString(music, 'title') || '音乐' }}</strong>
            <span v-if="readMediaString(music, 'artist')">{{ readMediaString(music, 'artist') }}</span>
          </div>
          <audio v-if="musicAudioUrl" :src="musicAudioUrl" controls preload="metadata" />
          <iframe
            v-else-if="musicEmbedUrl"
            :src="musicEmbedUrl"
            title="Netease music player"
            loading="lazy"
            frameborder="0"
            allow="autoplay"
          />
          <a v-else-if="musicExternalUrl" :href="musicExternalUrl" target="_blank" rel="noreferrer">
            打开音乐链接
          </a>
        </section>

        <section
          v-if="videoUrl || videoEmbedUrl || videoExternalUrl"
          class="post-media"
        >
          <div class="media-heading">
            <strong>{{ readMediaString(video, 'title') || '视频' }}</strong>
          </div>
          <video
            v-if="videoUrl"
            :src="videoUrl"
            controls
            preload="metadata"
          />
          <iframe
            v-else-if="videoEmbedUrl"
            :src="videoEmbedUrl"
            title="Video player"
            loading="lazy"
            frameborder="0"
            allow="fullscreen; encrypted-media; picture-in-picture"
            allowfullscreen
          />
          <a v-else-if="videoExternalUrl" :href="videoExternalUrl" target="_blank" rel="noreferrer">
            打开视频链接
          </a>
        </section>
      </template>

      <ul v-if="post.tags.length > 0">
        <li v-for="tag in post.tags" :key="tag">{{ tag }}</li>
      </ul>
    </article>
  </main>
</template>

<style scoped>
.post-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.post-content :deep(pre) {
  overflow-x: auto;
}

.moment-text {
  white-space: pre-wrap;
  line-height: 1.8;
}

.moment-photos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0;
}

.moment-photos img {
  aspect-ratio: 1 / 1;
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.post-media {
  display: grid;
  gap: 12px;
  margin: 20px 0;
  padding: 16px;
  border-radius: 8px;
  background: var(--card-bg, #fff);
  box-shadow: var(--card-shadow, 0px 8px 24px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0px rgba(0, 0, 0, 0.02));
}

.media-heading {
  display: grid;
  gap: 4px;
}

.media-heading span {
  color: var(--text-muted, #666);
  font-size: 14px;
}

.post-media audio,
.post-media video,
.post-media iframe {
  width: 100%;
}

.post-media video,
.post-media iframe {
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  background: #000;
}
</style>
