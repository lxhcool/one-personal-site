<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue';
import { listPublicPosts } from '~/entities/post/api/postApi';

const { data: postsData } = await useAsyncData('public-articles', () => listPublicPosts('ARTICLE'));
const posts = computed(() => {
  if (!postsData.value) throw createError({ statusCode: 500, statusMessage: 'Failed to load posts' });
  return postsData.value;
});

function formatDate(value?: string | null) {
  if (!value) return '未标记';
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}
</script>

<template>
  <main>
    <WorkbenchWindow path="~/articles" :status="`${posts.length} files`" title="文章归档">
      <template #eyebrow>long-form notes</template>
      <template #headingAside>按时间倒序</template>

      <p class="archive-command"><span>~/articles $</span> find . -name "*.md" -print</p>

      <div v-if="posts.length" class="archive-list">
        <NuxtLink v-for="(post, index) in posts" :key="post.id" :to="`/blog/${post.slug}`" class="archive-row">
          <span class="archive-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="archive-copy">
            <strong>{{ post.title }}</strong>
            <span>{{ post.excerpt || '打开文章继续阅读' }}</span>
          </span>
          <span class="archive-info">
            <time :datetime="post.publishedAt || post.createdAt">{{ formatDate(post.publishedAt || post.createdAt) }}</time>
            <small>{{ post.category || 'notes' }}</small>
          </span>
          <ArrowUpRight class="archive-arrow" :size="15" />
        </NuxtLink>
      </div>

      <div v-else class="archive-empty">
        <span>0 files found</span>
        <p>还没有已发布的文章。</p>
      </div>
    </WorkbenchWindow>
  </main>
</template>

<style scoped>
.archive-command { margin: -7px 0 20px; padding: 10px 12px; border-radius: 5px; background: rgba(54, 65, 73, 0.045); color: #858e95; font-family: 'IBM Plex Mono', monospace; font-size: 9px; }
.archive-command span { color: #328066; }
.archive-list { border-top: 1px solid rgba(52, 63, 72, 0.12); }
.archive-row { display: grid; grid-template-columns: 35px minmax(0, 1fr) 94px 18px; gap: 12px; align-items: center; min-height: 91px; border-bottom: 1px solid rgba(52, 63, 72, 0.1); transition: background 140ms ease, transform 140ms ease; }
.archive-row:hover { background: rgba(84, 74, 117, 0.035); transform: translateX(3px); }
.archive-number { color: #a0a6aa; font-family: 'IBM Plex Mono', monospace; font-size: 9px; }
.archive-copy { display: grid; gap: 5px; min-width: 0; }
.archive-copy strong { color: #344049; font-size: 15px; letter-spacing: -0.025em; }
.archive-copy > span { overflow: hidden; color: #7a848b; font-size: 10px; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.archive-info { display: grid; gap: 4px; color: #879097; font-family: 'IBM Plex Mono', monospace; font-size: 8px; text-align: right; }
.archive-info small { color: #5e876f; font-size: 8px; }
.archive-arrow { color: #9aa1a6; }
.archive-empty { padding: 72px 20px; color: #7f888f; text-align: center; }
.archive-empty span { font-family: 'IBM Plex Mono', monospace; font-size: 10px; }
.archive-empty p { font-size: 12px; }
@media (max-width: 560px) { .archive-row { grid-template-columns: 25px minmax(0, 1fr) 16px; gap: 8px; }.archive-info { display: none; } }
</style>
