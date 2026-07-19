<script setup lang="ts">
import { listPublicPosts } from '~/entities/post/api/postApi';
import type { Post } from '~/entities/post/model/types';

const { data: postsData } = await useAsyncData('public-articles', () => listPublicPosts('ARTICLE'));
const posts = computed(() => {
  if (!postsData.value) throw createError({ statusCode: 500, statusMessage: 'Failed to load posts' });
  return postsData.value;
});

const articleGroups = computed(() => {
  const groups = new Map<string, Post[]>();
  for (const post of posts.value) {
    const date = new Date(post.publishedAt || post.createdAt);
    const year = Number.isNaN(date.getTime()) ? '未归档' : String(date.getFullYear());
    const group = groups.get(year) ?? [];
    group.push(post);
    groups.set(year, group);
  }
  return Array.from(groups, ([year, articles]) => ({ year, articles }));
});

function formatShortDate(value?: string | null) {
  if (!value) return '--.--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--.--';
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function readingMinutes(content: string) {
  return Math.max(1, Math.ceil(content.replace(/\s+/g, '').length / 350));
}

function articleMeta(post: Post) {
  return `${post.category || '随笔'} · ${readingMinutes(post.content)} min`;
}
</script>

<template>
  <main>
    <WorkbenchWindow path="~/articles" :status="`${posts.length} files`">
      <div v-if="posts.length" class="article-archive">
        <section v-for="group in articleGroups" :key="group.year" class="year-group">
          <header class="year-heading">
            <strong>{{ group.year }}</strong>
            <span>{{ group.articles.length }} 篇</span>
          </header>

          <NuxtLink
            v-for="post in group.articles"
            :key="post.id"
            :to="`/blog/${post.slug}`"
            class="article-row"
          >
            <span class="article-copy">
              <strong>{{ post.title }}</strong>
              <small>{{ articleMeta(post) }}</small>
            </span>
            <time :datetime="post.publishedAt || post.createdAt">{{ formatShortDate(post.publishedAt || post.createdAt) }}</time>
          </NuxtLink>
        </section>
      </div>

      <div v-else class="archive-empty">
        <span>0 articles</span>
        <p>还没有已发布的文章。</p>
      </div>
    </WorkbenchWindow>
  </main>
</template>

<style scoped>
.article-archive { display: grid; gap: 27px; }
.year-heading { display: flex; align-items: baseline; justify-content: space-between; min-height: 27px; border-bottom: 1px solid rgba(89,78,62,.18); font-family: 'IBM Plex Mono', monospace; }
.year-heading strong { color: #47535a; font-size: 11px; }
.year-heading span { color: #92999d; font-size: 8px; }
.article-row { display: grid; grid-template-columns: minmax(0,1fr) 48px; gap: 18px; align-items: center; min-height: 58px; padding: 7px 8px; border-bottom: 1px dashed rgba(89,78,62,.13); transition: background 130ms ease; }
.article-row:hover { border-radius: 4px; background: rgba(235,228,215,.22); }
.article-copy { display: grid; gap: 5px; min-width: 0; }
.article-copy strong { overflow: hidden; color: #3f4b52; font-size: 14px; letter-spacing: -.02em; text-overflow: ellipsis; white-space: nowrap; }
.article-copy small { color: #818a90; font-family: 'IBM Plex Mono', monospace; font-size: 8px; }
.article-row time { color: #879095; font-family: 'IBM Plex Mono', monospace; font-size: 8px; text-align: right; }
.archive-empty { padding: 72px 20px; color: #7f888f; text-align: center; }
.archive-empty span { font-family: 'IBM Plex Mono', monospace; font-size: 10px; }
.archive-empty p { font-size: 12px; }
@media (max-width: 560px) {
  .article-archive { gap: 22px; }
  .article-row { min-height: 54px; padding-inline: 4px; }
  .article-copy strong { font-size: 13px; }
}
</style>
