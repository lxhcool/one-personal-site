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

function postSlug(post: { publishedAt?: string | null }, idx: number): string {
  if (post.publishedAt) {
    const d = new Date(post.publishedAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(idx + 1)}`;
  }
  return `post-${idx + 1}`;
}
</script>

<template>
  <main class="home-page">
    <!-- ====== Terminal Container ====== -->
    <section class="terminal">
      <!-- Header bar -->
      <div class="term-bar">
        <span class="tb-dots">
          <span class="tb-dot tb-close"></span>
          <span class="tb-dot tb-min"></span>
          <span class="tb-dot tb-max"></span>
        </span>
        <span class="tb-title">lxhcool@site — ~/posts — bash</span>
        <span class="tb-spacer"></span>
      </div>

      <!-- Body -->
      <div class="term-body">
        <!-- Session init -->
        <p class="term-line term-dim">
          Last login: {{ formatDate(new Date().toISOString()) }} on ttys001
        </p>
        <p class="term-line">
          <span class="prompt">~/posts $</span>
          <span class="cmd">ls -lt *.md</span>
        </p>
        <p class="term-line term-dim" v-if="home.posts.length > 0">
          <template v-for="(post, idx) in home.posts" :key="post.id">
            {{ postSlug(post, idx) }}.md<br v-if="idx < home.posts.length - 1" />
          </template>
        </p>

        <!-- Empty -->
        <template v-if="home.posts.length === 0">
          <p class="term-line">
            <span class="prompt">~/posts $</span>
            <span class="cmd">cat *.md</span>
          </p>
          <p class="term-line term-dim">cat: no posts found</p>
        </template>

        <!-- Each post as cat output -->
        <template v-for="(post, idx) in home.posts" :key="post.id">
          <p class="term-line" :style="{ marginTop: idx === 0 ? '12px' : '20px' }">
            <span class="prompt">~/posts $</span>
            <span class="cmd">cat {{ postSlug(post, idx) }}.md</span>
          </p>
          <div class="term-divider"></div>

          <!-- Content block -->
          <div class="term-output">
            <p class="term-text">{{ post.title }}</p>

            <!-- Photos -->
            <div
              v-if="readMediaStringArray(post.media, 'photos').length > 0"
              :class="[
                'term-photos',
                readMediaStringArray(post.media, 'photos').length === 1 ? 'term-photos--single' : '',
              ]"
            >
              <img
                v-for="photo in readMediaStringArray(post.media, 'photos')"
                :key="photo"
                :src="resolveAssetUrl(photo)"
                alt=""
                loading="lazy"
              />
            </div>

            <!-- Music -->
            <MomentMusicCard
              v-if="readMediaString(getMomentMusic(post.media), 'audioUrl') || readMediaString(getMomentMusic(post.media), 'embedUrl') || readMediaString(getMomentMusic(post.media), 'externalUrl')"
              :music="getMomentMusic(post.media)"
              :fallback-photo="readMediaStringArray(post.media, 'photos')[0]"
            />

            <!-- Video -->
            <div
              v-if="readMediaString(getMomentVideo(post.media), 'videoUrl') || readMediaString(getMomentVideo(post.media), 'embedUrl') || readMediaString(getMomentVideo(post.media), 'externalUrl')"
              class="term-video"
            >
              <span class="term-dim">▶ {{ readMediaString(getMomentVideo(post.media), 'title') || 'video' }}</span>
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
            </div>

            <!-- Footer -->
            <footer class="term-footer">
              <time v-if="post.publishedAt" :datetime="post.publishedAt" class="term-time">
                {{ formatDate(post.publishedAt) }}
              </time>
              <span class="term-sep">·</span>
              <button type="button" class="term-action" aria-label="Like">
                <Heart :size="12" stroke-width="1.8" />
              </button>
              <button type="button" class="term-action" aria-label="Comment">
                <MessageCircle :size="12" stroke-width="1.8" />
              </button>
            </footer>
          </div>
        </template>

        <!-- Blinking cursor -->
        <p class="term-line term-cursor">
          <span class="prompt">~/posts $</span>
          <span class="blink">▊</span>
        </p>
      </div>
    </section>

    <!-- ====== Projects ====== -->
    <section v-if="home.projects.length > 0" class="term-projects">
      <p class="term-line term-dim">~/projects $ ls</p>
      <ul class="proj-list">
        <li v-for="project in home.projects" :key="project.id">
          <NuxtLink :to="`/projects/${project.slug}`">{{ project.title }}</NuxtLink>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
/* ── 页面布局 ── */
.home-page {
  display: grid;
  gap: 20px;
}

/* ================================================
   Terminal Container
   ================================================ */
.terminal {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.65;
  color: #3a4654;
}

/* ── Terminal Header Bar ── */
.term-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  user-select: none;
}

.tb-dots {
  display: flex;
  gap: 7px;
  flex-shrink: 0;
}

.tb-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.tb-close {
  background: #ff5f57;
}

.tb-min {
  background: #febc2e;
}

.tb-max {
  background: #28c840;
}

.tb-title {
  flex: 1;
  text-align: center;
  font-size: 11px;
  color: #8a94a6;
  letter-spacing: 0.3px;
}

.tb-spacer {
  width: 48px;
  flex-shrink: 0;
}

/* ── Terminal Body ── */
.term-body {
  padding: 16px 18px 14px;
  overflow-x: auto;
}

/* ── Terminal Lines ── */
.term-line {
  margin: 0;
  white-space: nowrap;
}

.term-dim {
  color: #9ca3af;
}

/* ── Prompt ── */
.prompt {
  color: #059669;
  font-weight: 500;
  margin-right: 8px;
}

.cmd {
  color: #7c3aed;
}

/* ── Divider ── */
.term-divider {
  height: 1px;
  margin: 6px 0 10px;
  background: repeating-linear-gradient(
    to right,
    rgba(0, 0, 0, 0.08) 0,
    rgba(0, 0, 0, 0.08) 4px,
    transparent 4px,
    transparent 8px
  );
}

/* ── Post Content Block ── */
.term-output {
  padding-left: 0;
}

.term-text {
  margin: 0 0 12px;
  color: #1f2937;
  font-size: 13px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── Photos ── */
.term-photos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 12px;
  border-radius: 4px;
  overflow: hidden;
}

.term-photos--single {
  grid-template-columns: 1fr;
}

.term-photos img {
  aspect-ratio: 1 / 1;
  width: 100%;
  border-radius: 3px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.term-photos img:hover {
  opacity: 0.85;
}

.term-photos--single img {
  aspect-ratio: 16 / 9;
}

/* ── Video ── */
.term-video {
  margin-bottom: 12px;
}

.term-video video,
.term-video iframe {
  aspect-ratio: 16 / 9;
  width: 100%;
  border-radius: 4px;
  background: #000;
  margin-top: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* ── Footer ── */
.term-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: #9ca3af;
  font-size: 11px;
}

.term-time {
  color: #9ca3af;
}

.term-sep {
  color: #d1d5db;
}

.term-action {
  display: inline-flex;
  align-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  padding: 2px 4px;
  transition: color 0.15s ease, background 0.15s ease;
}

.term-action:hover {
  color: #374151;
  background: rgba(0, 0, 0, 0.04);
}

/* ── Blinking Cursor ── */
.term-cursor {
  margin-top: 16px;
}

.blink {
  color: #059669;
  animation: term-blink 1s step-end infinite;
}

@keyframes term-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ================================================
   Projects section (also terminal-styled)
   ================================================ */
.term-projects {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.65;
  color: #3a4654;
  padding: 0;
}

.proj-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.proj-list li {
  margin: 0;
}

.proj-list a {
  display: inline-block;
  color: #7c3aed;
  text-decoration: none;
  padding: 3px 6px;
  margin: -3px -6px;
  border-radius: 3px;
  transition: background 0.12s ease, color 0.12s ease;
}

.proj-list a:hover {
  background: rgba(124, 58, 237, 0.08);
  color: #6d28d9;
}

/* ================================================
   Responsive
   ================================================ */
@media (max-width: 680px) {
  .term-body {
    padding: 12px 14px 10px;
  }

  .terminal {
    font-size: 12px;
  }

  .term-photos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .term-text {
    font-size: 12px;
  }
}
</style>
