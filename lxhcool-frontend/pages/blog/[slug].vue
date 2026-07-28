<script setup lang="ts">
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { getPublicPost } from '~/entities/post/api/postApi';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';
import { createThumbnailUrl, resolvePublicImageUrl } from '~/shared/media/imageSources';

const route = useRoute();
const slug = String(route.params.slug);
const { publicApiBaseUrl } = getRequiredPublicRuntimeConfig();
const { open: openImagePreview } = useImagePreview();
const { data: postData } = await useAsyncData(`public-post-${slug}`, () => getPublicPost(slug));

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

const languageAliases: Record<string, string> = {
  html: 'xml',
  js: 'javascript',
  md: 'markdown',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
  vue: 'xml',
};
const markdownParser = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, language) {
      const requestedLanguage = language.trim().split(/\s+/)[0]?.toLowerCase() || 'plaintext';
      const normalizedLanguage = languageAliases[requestedLanguage] ?? requestedLanguage;
      const supportedLanguage = hljs.getLanguage(normalizedLanguage)
        ? normalizedLanguage
        : 'plaintext';
      return hljs.highlight(code, {
        language: supportedLanguage,
        ignoreIllegals: true,
      }).value;
    },
  }),
);

const post = computed(() => {
  if (!postData.value) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' });
  }

  return postData.value;
});

type ArticleHeading = {
  id: string;
  text: string;
  level: number;
};

const articleDocument = computed(() => buildArticleDocument(post.value.content));
const renderedContent = computed(() => articleDocument.value.html);
const articleHeadings = computed(() => (post.value.type === 'ARTICLE' ? articleDocument.value.headings : []));
const activeHeadingId = ref('');
const coverImage = computed(() => resolveAssetUrl(post.value.coverImage));
const coverThumbnail = computed(() => post.value.coverImage
  ? createThumbnailUrl(post.value.coverImage, publicApiBaseUrl, { width: 960, height: 720, fit: 'inside' })
  : undefined);
const media = computed(() => post.value.media ?? {});
const photos = computed(() => readMediaStringArray('photos').map((photo) => ({
  src: resolvePublicImageUrl(photo, publicApiBaseUrl),
  thumbnail: createThumbnailUrl(photo, publicApiBaseUrl, { width: 320, height: 320, fit: 'cover' }),
  alt: post.value.title,
})));
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
const postMetaItems = computed(() => [
  { label: 'type', value: post.value.type === 'ARTICLE' ? 'article' : 'moment' },
  { label: 'date', value: formatDate(post.value.publishedAt || post.value.createdAt) },
  ...(post.value.category ? [{ label: 'category', value: post.value.category }] : []),
  ...(post.value.tags.length > 0 ? [{ label: 'tags', value: `${post.value.tags.length}` }] : []),
]);

useSeoMeta({
  title: () => post.value.seoTitle ?? post.value.title,
  description: () => post.value.seoDescription ?? post.value.excerpt ?? undefined,
  ogImage: () => post.value.ogImage ?? coverImage.value ?? photos.value[0]?.src ?? undefined,
});

function resolveAssetUrl(url?: string | null) {
  if (!url) return undefined;
  return resolvePublicImageUrl(url, publicApiBaseUrl);
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

function formatDate(value?: string | null) {
  if (!value) return '未标记日期';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function buildArticleDocument(content: string) {
  const headings: ArticleHeading[] = [];
  const usedIds = new Map<string, number>();
  const source = markdownParser.parse(content, { async: false }) as string;
  const headingHtml = source.replace(
    /<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_match, rawLevel: string, rawAttributes: string, innerHtml: string) => {
      const level = Number(rawLevel);
      const text = decodeHeadingText(innerHtml);
      const baseId = createHeadingId(text) || `section-${headings.length + 1}`;
      const duplicateIndex = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, duplicateIndex + 1);
      const id = duplicateIndex === 0 ? baseId : `${baseId}-${duplicateIndex + 1}`;
      const attributes = rawAttributes.replace(/\s+id=(['"]).*?\1/i, '');
      headings.push({ id, text, level });
      return `<h${level}${attributes} id="${id}">${innerHtml}</h${level}>`;
    },
  );

  const html = headingHtml.replace(
    /<img\b([^>]*?)src=(['"])(.*?)\2([^>]*)>/gi,
    (match, before: string, _quote: string, rawSource: string, after: string) => {
      const sourceUrl = rawSource.replace(/&amp;/g, '&');
      const fullSource = resolveAssetUrl(sourceUrl);
      if (!fullSource) return match;
      const thumbnailSource = createThumbnailUrl(sourceUrl, publicApiBaseUrl, { width: 960, fit: 'inside' });
      const attributes = `${before}${after}`
        .replace(/\s+data-full-src=(['"]).*?\1/gi, '')
        .replace(/\s+loading=(['"]).*?\1/gi, '')
        .replace(/\s+decoding=(['"]).*?\1/gi, '');
      return `<img${attributes} src="${escapeHtmlAttribute(thumbnailSource)}" data-full-src="${escapeHtmlAttribute(fullSource)}" loading="lazy" decoding="async">`;
    },
  );

  return { html, headings };
}

function updateActiveHeading() {
  if (!import.meta.client || articleHeadings.value.length === 0) return;
  let nextActiveId = articleHeadings.value[0]?.id ?? '';

  for (const heading of articleHeadings.value) {
    const element = document.getElementById(heading.id);
    if (element && element.getBoundingClientRect().top <= 140) {
      nextActiveId = heading.id;
    } else {
      break;
    }
  }

  activeHeadingId.value = nextActiveId;
}

let activeHeadingFrame = 0;
function scheduleActiveHeadingUpdate() {
  cancelAnimationFrame(activeHeadingFrame);
  activeHeadingFrame = requestAnimationFrame(updateActiveHeading);
}

onMounted(() => {
  nextTick(updateActiveHeading);
  window.addEventListener('scroll', scheduleActiveHeadingUpdate, { passive: true });
  window.addEventListener('resize', scheduleActiveHeadingUpdate, { passive: true });
});

onBeforeUnmount(() => {
  cancelAnimationFrame(activeHeadingFrame);
  window.removeEventListener('scroll', scheduleActiveHeadingUpdate);
  window.removeEventListener('resize', scheduleActiveHeadingUpdate);
});

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function onArticleImageClick(event: MouseEvent) {
  const target = event.target;
  const container = event.currentTarget;
  if (!(target instanceof HTMLImageElement) || !(container instanceof HTMLElement)) return;

  const imageElements = Array.from(container.querySelectorAll<HTMLImageElement>('img[data-full-src]'));
  const images = imageElements.map((image) => ({
    src: image.dataset.fullSrc || image.currentSrc || image.src,
    alt: image.alt,
  }));
  const index = imageElements.indexOf(target);
  if (index >= 0) openImagePreview(images, index);
}

function decodeHeadingText(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function createHeadingId(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}
</script>

<template>
  <main>
    <DetailPageShell
      :back-label="post.type === 'ARTICLE' ? '返回文章归档' : '返回动态'"
      :back-to="post.type === 'ARTICLE' ? '/blog' : '/'"
      :description="post.excerpt"
      :eyebrow="post.type === 'ARTICLE' ? 'article / note' : 'moment / log'"
      :meta-items="postMetaItems"
      :title="post.title"
    >
      <template v-if="post.type === 'ARTICLE' && coverImage && coverThumbnail" #cover>
        <button type="button" class="document-cover-trigger" aria-label="预览文章封面" @click="openImagePreview([{ src: coverImage, alt: post.title }])">
          <img class="document-cover" :src="coverThumbnail" :alt="post.title" decoding="async" />
        </button>
      </template>

      <template v-if="post.type === 'ARTICLE'">
        <DetailRichContent :html="renderedContent" @click="onArticleImageClick" />
      </template>

      <template v-else>
        <p v-if="post.content" class="moment-text">{{ post.content }}</p>

        <div v-if="photos.length > 0" class="moment-photos">
          <button v-for="(photo, photoIndex) in photos" :key="photo.src" type="button" :aria-label="`预览图片 ${photoIndex + 1}`" @click="openImagePreview(photos, photoIndex)">
            <img :src="photo.thumbnail" :alt="photo.alt" loading="lazy" decoding="async" />
          </button>
        </div>

        <section v-if="musicAudioUrl || musicEmbedUrl || musicExternalUrl" class="post-media">
          <div class="media-heading">
            <strong>{{ readMediaString(music, 'title') || '音乐' }}</strong>
            <span v-if="readMediaString(music, 'artist')">{{ readMediaString(music, 'artist') }}</span>
          </div>
          <audio v-if="musicAudioUrl" :src="musicAudioUrl" controls preload="metadata" />
          <iframe v-else-if="musicEmbedUrl" :src="musicEmbedUrl" title="音乐播放器" loading="lazy" frameborder="0" allow="autoplay" />
          <a v-else-if="musicExternalUrl" :href="musicExternalUrl" target="_blank" rel="noreferrer">打开音乐链接</a>
        </section>

        <section v-if="videoUrl || videoEmbedUrl || videoExternalUrl" class="post-media">
          <div class="media-heading"><strong>{{ readMediaString(video, 'title') || '视频' }}</strong></div>
          <video v-if="videoUrl" :src="videoUrl" controls preload="metadata" />
          <iframe v-else-if="videoEmbedUrl" :src="videoEmbedUrl" title="视频播放器" loading="lazy" frameborder="0" allow="fullscreen; encrypted-media; picture-in-picture" allowfullscreen />
          <a v-else-if="videoExternalUrl" :href="videoExternalUrl" target="_blank" rel="noreferrer">打开视频链接</a>
        </section>
      </template>

      <footer v-if="post.tags.length > 0" class="document-tags">
        <span v-for="tag in post.tags" :key="tag"># {{ tag }}</span>
      </footer>

      <template v-if="post.type === 'ARTICLE' && articleHeadings.length > 0" #aside>
        <section class="article-toc" aria-label="文章目录">
          <p class="toc-title"><span>本文目录</span><small>{{ articleHeadings.length }}</small></p>
          <nav>
            <a
              v-for="heading in articleHeadings"
              :key="heading.id"
              :href="`#${heading.id}`"
              class="toc-item"
              :class="[`toc-level-${heading.level}`, { active: activeHeadingId === heading.id }]"
              :aria-current="activeHeadingId === heading.id ? 'location' : undefined"
            >{{ heading.text }}</a>
          </nav>
        </section>
      </template>
    </DetailPageShell>
    <BackToTop />
  </main>
</template>

<style scoped>
.document-cover-trigger {
  display: block;
  width: 100%;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 16px;
  background: color-mix(in oklch, var(--page-bg) 78%, var(--text) 8%);
  cursor: zoom-in;
}

.document-cover {
  display: block;
  width: 100%;
  max-height: 440px;
  border-radius: inherit;
  object-fit: cover;
  transition: transform 160ms ease;
}

.document-cover-trigger:hover .document-cover {
  transform: scale(1.012);
}

.article-toc {
  display: grid;
  gap: 12px;
  min-width: 0;
  font-family: 'IBM Plex Mono', monospace;
}

.toc-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.toc-title small {
  display: grid;
  min-width: 19px;
  height: 19px;
  place-items: center;
  border-radius: 999px;
  background: color-mix(in oklch, var(--page-bg) 80%, var(--text) 8%);
  font-size: 8px;
}

.article-toc nav {
  display: grid;
  gap: 3px;
}

.toc-item {
  position: relative;
  display: block;
  overflow: hidden;
  padding: 6px 8px 6px 12px;
  border-radius: 7px;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background 140ms ease, color 140ms ease;
}

.toc-item::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 2px;
  height: 12px;
  border-radius: 999px;
  background: transparent;
  content: '';
  transform: translateY(-50%);
}

.toc-level-3 {
  padding-left: 23px;
}

.toc-level-4 {
  padding-left: 31px;
  font-size: 9px;
}

.toc-item:hover,
.toc-item.active {
  background: color-mix(in oklch, var(--page-bg) 78%, var(--text) 8%);
  color: var(--text);
}

.toc-item.active::before {
  height: 18px;
  background: oklch(58% .08 150);
}

.moment-text {
  color: color-mix(in oklch, var(--text) 84%, var(--page-bg));
  font-size: 16px;
  line-height: 2;
  white-space: pre-wrap;
}

.moment-photos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin: 28px 0;
  overflow: hidden;
  border-radius: 16px;
}

.moment-photos button {
  display: block;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: color-mix(in oklch, var(--page-bg) 78%, var(--text) 8%);
  cursor: zoom-in;
}

.moment-photos img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 150ms ease;
}

.moment-photos button:hover img {
  transform: scale(1.025);
}

.post-media {
  display: grid;
  gap: 13px;
  margin: 26px 0;
  padding: 17px;
  border: 1px solid color-mix(in oklch, var(--text) 13%, transparent);
  border-radius: 14px;
  background: color-mix(in oklch, var(--page-bg) 86%, var(--text) 5%);
}

.media-heading {
  display: grid;
  gap: 4px;
}

.media-heading strong {
  color: var(--text);
}

.media-heading span {
  color: var(--text-muted);
  font-size: 12px;
}

.post-media audio,
.post-media video,
.post-media iframe {
  width: 100%;
}

.post-media video,
.post-media iframe {
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  background: #111;
}

.post-media a {
  color: var(--text);
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.document-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 48px;
  padding-top: 22px;
  border-top: 1px solid color-mix(in oklch, var(--text) 12%, transparent);
}

.document-tags span {
  padding: 5px 8px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--page-bg) 80%, var(--text) 7%);
  color: var(--text-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
}

@media (max-width: 1120px) {
  .article-toc nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 12px;
  }
}

@media (max-width: 560px) {
  .moment-photos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .article-toc nav {
    grid-template-columns: 1fr;
  }
}
</style>
