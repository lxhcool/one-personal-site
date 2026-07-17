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

type ArticleHeading = {
  id: string;
  text: string;
  level: number;
};

const articleDocument = computed(() => buildArticleDocument(post.value.content));
const renderedContent = computed(() => articleDocument.value.html);
const articleHeadings = computed(() => (post.value.type === 'ARTICLE' ? articleDocument.value.headings : []));
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
  const html = source.replace(
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

  return { html, headings };
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
          <img v-if="coverImage" class="document-cover" :src="coverImage" :alt="post.title" />
          <div class="post-content" v-html="renderedContent" />
        </template>

        <template v-else>
          <p v-if="post.content" class="moment-text">{{ post.content }}</p>

          <div v-if="photos.length > 0" class="moment-photos">
            <img v-for="photo in photos" :key="photo" :src="photo" alt="" />
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
.back-link { display: inline-flex; margin-bottom: 35px; color: #778189; font-family: 'IBM Plex Mono', monospace; font-size: 9px; }
.back-link:hover { color: #6550a5; }
.document-header { margin-bottom: 30px; }
.document-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; margin-bottom: 12px; color: #828c93; font-family: 'IBM Plex Mono', monospace; font-size: 8px; letter-spacing: .06em; text-transform: uppercase; }
.document-meta span:first-child { padding: 3px 6px; border-radius: 3px; background: rgba(50,128,102,.09); color: #397d67; }
.document-header h1 { margin: 0; color: #28333b; font-size: clamp(34px, 5.5vw, 52px); letter-spacing: -.06em; line-height: 1.06; }
.document-lead { margin: 18px 0 0; color: #68737b; font-size: 14px; line-height: 1.8; }
.document-cover { width: 100%; max-height: 380px; margin: 0 0 34px; border-radius: 7px; object-fit: cover; box-shadow: 0 12px 28px rgba(52,60,65,.11); }
.post-content { color: #414d55; font-size: 14px; line-height: 1.95; }
.post-content :deep(h2) { margin: 38px 0 14px; color: #2f3b43; font-size: 23px; letter-spacing: -.035em; }
.post-content :deep(h3) { margin: 30px 0 12px; color: #344049; font-size: 18px; }
.post-content :deep(h2), .post-content :deep(h3), .post-content :deep(h4) { scroll-margin-top: 24px; }
.post-content :deep(p) { margin: 0 0 18px; }
.post-content :deep(a) { color: #6550a5; text-decoration: underline; text-underline-offset: 3px; }
.post-content :deep(img) { max-width: 100%; height: auto; margin: 26px 0; border-radius: 6px; }
.post-content :deep(blockquote) { margin: 25px 0; padding: 2px 0 2px 18px; border-left: 2px solid #6d9b83; color: #68747b; }
.post-content :deep(code) { border-radius: 3px; background: rgba(61,72,80,.07); color: #6550a5; font-family: 'IBM Plex Mono', monospace; font-size: .86em; }
.post-content :deep(pre) { overflow-x: auto; margin: 24px 0; padding: 17px; border: 1px solid rgba(57,68,76,.13); border-radius: 6px; background: #2f373d; color: #e7e9e8; line-height: 1.7; }
.post-content :deep(pre code) { background: transparent; color: inherit; }
.moment-text { color: #445159; font-size: 14px; line-height: 1.9; white-space: pre-wrap; }
.moment-photos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; margin: 24px 0; overflow: hidden; border-radius: 7px; }
.moment-photos img { aspect-ratio: 1 / 1; width: 100%; object-fit: cover; }
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
@media (max-width: 560px) { .document-header h1 { font-size: 36px; }.moment-photos { grid-template-columns: repeat(2,minmax(0,1fr)); }.article-toc nav { grid-template-columns: 1fr; } }
</style>
