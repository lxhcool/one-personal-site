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
    <div class="article-page">
      <div v-if="posts.length" class="article-archive" aria-label="文章列表">
        <section v-for="group in articleGroups" :key="group.year" class="year-group">
          <header class="year-heading">
            <strong>{{ group.year }}</strong>
            <span>{{ group.articles.length }} 篇</span>
          </header>

          <div class="article-list">
            <NuxtLink
              v-for="post in group.articles"
              :key="post.id"
              :to="`/blog/${post.slug}`"
              class="article-row"
            >
              <time :datetime="post.publishedAt || post.createdAt">{{ formatShortDate(post.publishedAt || post.createdAt) }}</time>
              <span class="article-copy">
                <strong>{{ post.title }}</strong>
                <small>{{ articleMeta(post) }}</small>
              </span>
            </NuxtLink>
          </div>
        </section>
      </div>

      <div v-else class="archive-empty">
        <span>0 articles</span>
        <p>还没有已发布的文章。</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.article-page {
  width: 100%;
}

.article-archive {
  display: grid;
  gap: 46px;
}

.year-group {
  display: grid;
  gap: 14px;
  align-items: start;
}

.year-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  font-family: 'IBM Plex Mono', monospace;
}

.year-heading strong {
  color: color-mix(in oklch, var(--text) 34%, transparent);
  font-size: 42px;
  font-weight: 500;
  letter-spacing: -.08em;
  line-height: .86;
}

.year-heading span {
  color: var(--text-muted);
  font-size: 9px;
  letter-spacing: .06em;
}

.article-list {
  display: grid;
  gap: 8px;
}

.article-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  min-height: 58px;
  padding: 10px 12px;
  border-radius: 12px;
  background: transparent;
  transition: background 140ms ease, transform 140ms ease;
}

.article-row:hover {
  background: color-mix(in oklch, var(--page-bg) 74%, var(--text) 5%);
  transform: translateX(2px);
}

.article-row time {
  order: 2;
  color: var(--text-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  line-height: 1.6;
  white-space: nowrap;
}

.article-copy {
  order: 1;
  display: grid;
  gap: 4px;
  min-width: 0;
}

.article-copy strong {
  overflow: hidden;
  color: color-mix(in oklch, var(--text) 88%, var(--page-bg));
  font-size: 14px;
  font-weight: 520;
  letter-spacing: -.01em;
  line-height: 1.55;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 140ms ease;
}

.article-row:hover .article-copy strong {
  color: var(--text);
}

.article-copy small {
  color: var(--text-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  line-height: 1.45;
}

.archive-empty {
  padding: 72px 20px;
  color: var(--text-muted);
  text-align: center;
}

.archive-empty span {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
}

.archive-empty p {
  font-size: 12px;
}

@media (max-width: 560px) {
  .article-archive {
    gap: 38px;
  }

  .year-group {
    gap: 10px;
  }

  .year-heading {
    align-items: flex-end;
  }

  .year-heading strong {
    font-size: 34px;
  }

  .article-row {
    grid-template-columns: 1fr;
    gap: 3px;
    min-height: 0;
    padding: 9px 0;
    border-radius: 0;
  }

  .article-row:hover {
    background: transparent;
    transform: none;
  }

  .article-row time {
    order: 1;
  }

  .article-copy {
    order: 2;
  }

  .article-copy strong {
    font-size: 13px;
  }
}
</style>
