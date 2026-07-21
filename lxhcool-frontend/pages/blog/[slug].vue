<script setup lang="ts">
import { marked } from 'marked';
import { getPublicPost } from '~/entities/post/api/postApi';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';
import { createThumbnailUrl, resolvePublicImageUrl } from '~/shared/media/imageSources';

const route = useRoute();
const slug = String(route.params.slug);
const { publicApiBaseUrl } = getRequiredPublicRuntimeConfig();
const { open: openImagePreview } = useImagePreview();
const { data: postData } = await useAsyncData(`public-post-${slug}`, () => getPublicPost(slug));

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
  const source = marked.parse(content, { async: false }) as string;
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
    <div class="article-stage" :class="{ 'has-floating-toc': post.type === 'ARTICLE' && articleHeadings.length > 0 }">
      <WorkbenchWindow :path="post.type === 'ARTICLE' ? `~/articles/${post.slug}.md` : `~/moments/${post.slug}.log`" status="read only">
        <div class="document-layout">
        <article class="document">
        <NuxtLink :to="post.type === 'ARTICLE' ? '/blog' : '/'" class="back-link">← 返回{{ post.type === 'ARTICLE' ? '文章归档' : '动态' }}</NuxtLink>

        <header class="document-header">
          <div class="document-meta">
            <span>{{ post.type === 'ARTICLE' ? 'ARTICLE' : 'MOMENT' }}</span>
            <time :datetime="post.publishedAt || post.createdAt">{{ formatDate(post.publishedAt || post.createdAt) }}</time>
            <span v-if="post.category">{{ post.category }}</span>
          </div>
          <h1>{{ post.title }}</h1>
          <p v-if="post.excerpt" class="document-lead">{{ post.excerpt }}</p>
        </header>

        <template v-if="post.type === 'ARTICLE'">
          <button v-if="coverImage && coverThumbnail" type="button" class="document-cover-trigger" aria-label="预览文章封面" @click="openImagePreview([{ src: coverImage, alt: post.title }])">
            <img class="document-cover" :src="coverThumbnail" :alt="post.title" decoding="async" />
          </button>
          <div class="post-content" @click="onArticleImageClick" v-html="renderedContent" />
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
          </article>
        </div>
      </WorkbenchWindow>

      <aside v-if="post.type === 'ARTICLE' && articleHeadings.length > 0" class="article-toc" aria-label="文章目录">
        <p class="toc-title">contents/</p>
        <nav>
          <a
            v-for="heading in articleHeadings"
            :key="heading.id"
            :href="`#${heading.id}`"
            class="toc-item"
            :class="`toc-level-${heading.level}`"
          >{{ heading.text }}</a>
        </nav>
      </aside>
    </div>
    <BackToTop />
  </main>
</template>

<style scoped>
.article-stage { position: relative; }
.article-stage.has-floating-toc { display: grid; grid-template-columns: 680px 160px; gap: 14px; align-items: start; width: 854px; }
.document-layout { max-width: 570px; margin: 0 auto; }
.document { min-width: 0; max-width: 570px; }
.article-toc {
  position: sticky;
  top: 24px;
  z-index: 4;
  min-width: 0;
  margin-top: 86px;
  padding: 27px 13px 15px;
  border: 1px solid rgba(105,91,72,.24);
  border-radius: 5px 9px 8px 6px;
  background:
    linear-gradient(145deg, rgba(255,249,237,.3), transparent 42%),
    rgba(225,217,202,.72);
  box-shadow:
    8px 11px 23px rgba(82,66,45,.12),
    2px 3px 6px rgba(82,66,45,.07),
    inset 1px 1px 0 rgba(255,250,238,.42);
  backdrop-filter: blur(6px);
  font-family: 'IBM Plex Mono', monospace;
  transform: rotate(.65deg);
  transform-origin: 12px 0;
}
.article-toc::before {
  position: absolute;
  top: -9px;
  left: 17px;
  width: 34px;
  height: 16px;
  border: 1px solid rgba(83,89,89,.3);
  border-radius: 4px 4px 3px 3px;
  background: linear-gradient(180deg, rgba(239,241,238,.92), rgba(168,174,171,.78));
  box-shadow: 1px 3px 5px rgba(64,68,67,.16), inset 0 1px rgba(255,255,255,.62);
  content: '';
  transform: rotate(-5deg);
}
.article-toc::after {
  position: absolute;
  top: 18px;
  left: -15px;
  width: 15px;
  height: 1px;
  background: linear-gradient(90deg, rgba(105,91,72,.08), rgba(105,91,72,.35));
  content: '';
}
.toc-title { margin: 0 0 12px; padding-bottom: 9px; border-bottom: 1px dashed rgba(105,91,72,.22); color: #328066; font-size: 10px; font-weight: 700; }
.article-toc nav { display: grid; gap: 2px; }
.toc-item { position: relative; display: block; padding: 4px 5px 4px 16px; overflow: hidden; color: #626e74; font-size: 9px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; transition: color 130ms ease, background 130ms ease; }
.toc-item::before { position: absolute; top: 8px; left: 3px; width: 5px; height: 5px; border: 1px solid #8c9498; border-radius: 1px; content: ''; }
.toc-item::after { position: absolute; top: -4px; bottom: -4px; left: 5px; width: 1px; background: rgba(105,91,72,.13); content: ''; z-index: -1; }
.toc-item:first-child::after { top: 9px; }.toc-item:last-child::after { bottom: calc(100% - 9px); }
.toc-level-3 { padding-left: 28px; }.toc-level-3::before { left: 15px; width: 4px; height: 4px; border-radius: 50%; }.toc-level-3::after { left: 17px; }
.toc-level-4 { padding-left: 40px; color: #92999d; }.toc-level-4::before { left: 27px; width: 3px; height: 3px; border-radius: 50%; }.toc-level-4::after { left: 29px; }
.toc-item:hover { border-radius: 3px; background: rgba(101,80,165,.06); color: #6550a5; }
.back-link { display: inline-flex; margin-bottom: 24px; color: #737c7f; font-family: 'IBM Plex Mono', monospace; font-size: 9px; }
.back-link:hover { color: #6550a5; }
.document-header { margin-bottom: 24px; }
.document-meta { display: flex; flex-wrap: wrap; gap: 7px 12px; align-items: center; margin-bottom: 10px; color: #7b8385; font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: .045em; text-transform: uppercase; }
.document-meta span:first-child { padding: 3px 6px; border-radius: 3px; background: rgba(50,128,102,.09); color: #397d67; }
.document-header h1 { margin: 0; color: #30383b; font-size: 18px; font-weight: 700; letter-spacing: -.012em; line-height: 1.45; }
.document-lead { max-width: 64ch; margin: 10px 0 0; color: #697174; font-size: 13px; line-height: 1.72; }
.document-cover-trigger { display: block; width: 100%; margin: 0 0 26px; overflow: hidden; padding: 0; border: 0; border-radius: 7px; background: rgba(105,91,72,.07); cursor: zoom-in; box-shadow: 0 10px 24px rgba(52,60,65,.09); }
.document-cover { display: block; width: 100%; max-height: 380px; border-radius: inherit; object-fit: cover; transition: transform 160ms ease; }
.document-cover-trigger:hover .document-cover { transform: scale(1.012); }
.post-content { color: #4c5558; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.82; text-rendering: optimizeLegibility; }
.post-content :deep(h2) { margin: 30px 0 11px; color: #343d40; font-size: 16px; font-weight: 700; letter-spacing: -.012em; line-height: 1.55; }
.post-content :deep(h2::before) { margin-right: 7px; color: #56806c; content: '#'; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; }
.post-content :deep(h3) { margin: 24px 0 9px; color: #3b4447; font-size: 15px; font-weight: 650; line-height: 1.6; }
.post-content :deep(h4) { margin: 20px 0 8px; color: #465053; font-size: 14px; font-weight: 650; line-height: 1.65; }
.post-content :deep(h2), .post-content :deep(h3), .post-content :deep(h4) { scroll-margin-top: 24px; }
.post-content :deep(p) { margin: 0 0 12px; }
.post-content :deep(strong) { color: #343d40; font-weight: 650; }
.post-content :deep(a) { color: #62558d; text-decoration-color: rgba(98,85,141,.38); text-decoration-thickness: 1px; text-underline-offset: 3px; }
.post-content :deep(a:hover) { color: #4f7b67; text-decoration-color: rgba(79,123,103,.5); }
.post-content :deep(ul), .post-content :deep(ol) { margin: 5px 0 14px; padding-left: 1.45em; }
.post-content :deep(ul) { list-style: disc; }
.post-content :deep(ol) { list-style: decimal; }
.post-content :deep(li) { margin: 3px 0; padding-left: .12em; }
.post-content :deep(li::marker) { color: #789080; }
.post-content :deep(img) { max-width: 100%; height: auto; margin: 20px 0; border-radius: 6px; cursor: zoom-in; }
.post-content :deep(blockquote) { margin: 18px 0; padding: 1px 0 1px 14px; border-left: 2px solid #6f917f; color: #626d69; }
.post-content :deep(blockquote p:last-child) { margin-bottom: 0; }
.post-content :deep(code) { padding: .1em .34em; border-radius: 3px; background: rgba(82,72,60,.07); color: #62558d; font-family: 'IBM Plex Mono', monospace; font-size: .86em; }
.post-content :deep(pre) { overflow-x: auto; margin: 18px 0; padding: 14px 15px; border: 1px solid rgba(57,68,76,.13); border-radius: 6px; background: #2f373d; color: #e7e9e8; font-size: 12.5px; line-height: 1.68; }
.post-content :deep(pre code) { padding: 0; background: transparent; color: inherit; font-size: inherit; }
.post-content :deep(hr) { height: 1px; margin: 24px 0; border: 0; background: linear-gradient(90deg, transparent, rgba(91,84,73,.24) 14%, rgba(91,84,73,.24) 86%, transparent); }
.moment-text { color: #445159; font-size: 14px; line-height: 1.9; white-space: pre-wrap; }
.moment-photos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; margin: 24px 0; overflow: hidden; border-radius: 7px; }
.moment-photos button { display: block; aspect-ratio: 1 / 1; overflow: hidden; padding: 0; border: 0; background: rgba(105,91,72,.07); cursor: zoom-in; }
.moment-photos img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 150ms ease; }
.moment-photos button:hover img { transform: scale(1.025); }
.post-media { display: grid; gap: 12px; margin: 24px 0; padding: 16px; border: 1px solid rgba(55,66,74,.11); border-radius: 7px; background: rgba(229,232,231,.38); }
.media-heading { display: grid; gap: 3px; }.media-heading strong { color: #39454d; }.media-heading span { color: #7c868d; font-size: 11px; }
.post-media audio, .post-media video, .post-media iframe { width: 100%; }.post-media video, .post-media iframe { aspect-ratio: 16 / 9; border-radius: 5px; background: #222; }
.post-media a { color: #6550a5; font-size: 11px; }
.document-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 42px; padding-top: 20px; border-top: 1px dashed rgba(55,66,74,.16); }.document-tags span { padding: 4px 7px; border-radius: 3px; background: rgba(101,80,165,.07); color: #6550a5; font-family: 'IBM Plex Mono', monospace; font-size: 8px; }
@media (max-width: 1180px) {
  .article-stage.has-floating-toc { display: flex; width: 100%; flex-direction: column; }
  .article-stage.has-floating-toc .article-toc { order: -1; }
  .article-toc { position: static; width: 100%; margin: 0; padding: 18px 20px; border: 1px solid rgba(105,91,72,.15); border-radius: 7px; background: rgba(235,228,215,.2); box-shadow: none; backdrop-filter: none; transform: none; }
  .article-toc::before,
  .article-toc::after { display: none; }
  .article-toc nav { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 12px; }
}
@media (max-width: 560px) { .moment-photos { grid-template-columns: repeat(2,minmax(0,1fr)); }.article-toc nav { grid-template-columns: 1fr; } }
</style>
