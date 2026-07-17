<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue';
import { marked } from 'marked';
import { getPublicProject } from '~/entities/project/api/projectApi';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';

const route = useRoute();
const slug = String(route.params.slug);
const { apiBaseUrl } = getRequiredPublicRuntimeConfig();
const { data: projectData } = await useAsyncData(`public-project-${slug}`, () => getPublicProject(slug));

const project = computed(() => {
  if (!projectData.value) throw createError({ statusCode: 404, statusMessage: 'Project not found' });
  return projectData.value;
});
const renderedContent = computed(() => marked.parse(project.value.content || '', { async: false }) as string);
const coverImage = computed(() => resolveAssetUrl(project.value.coverImage));

useSeoMeta({
  title: () => project.value.seoTitle ?? project.value.title,
  description: () => project.value.seoDescription ?? project.value.excerpt ?? undefined,
  ogImage: () => project.value.ogImage ?? coverImage.value ?? undefined,
});

function resolveAssetUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  return `${apiBaseUrl}${url}`;
}
</script>

<template>
  <main>
    <WorkbenchWindow :path="`~/projects/${project.slug}`" status="repository">
      <article class="project-document">
        <NuxtLink to="/projects" class="back-link">← 返回项目目录</NuxtLink>

        <header class="project-header">
          <div class="repo-line"><span>public/repository</span><span v-if="project.featured">featured</span></div>
          <h1>{{ project.title }}</h1>
          <p v-if="project.excerpt">{{ project.excerpt }}</p>
          <div class="project-actions">
            <a v-if="project.liveUrl" :href="project.liveUrl" target="_blank" rel="noreferrer">访问项目 <ArrowUpRight :size="14" /></a>
            <a v-if="project.githubUrl" :href="project.githubUrl" target="_blank" rel="noreferrer"><span aria-hidden="true">&lt;/&gt;</span> 源代码</a>
          </div>
        </header>

        <img v-if="coverImage" class="project-cover" :src="coverImage" :alt="project.title" />

        <section v-if="project.techStack.length" class="tech-strip">
          <span class="tech-label">stack/</span>
          <span v-for="tech in project.techStack" :key="tech">{{ tech }}</span>
        </section>

        <div v-if="project.content" class="project-content" v-html="renderedContent" />
      </article>
    </WorkbenchWindow>
  </main>
</template>

<style scoped>
.project-document { max-width: 580px; margin: 0 auto; }
.back-link { display: inline-flex; margin-bottom: 35px; color: #778189; font-family: 'IBM Plex Mono', monospace; font-size: 9px; }.back-link:hover { color: #6550a5; }
.project-header { margin-bottom: 28px; }.repo-line { display: flex; gap: 7px; margin-bottom: 11px; color: #328066; font-family: 'IBM Plex Mono', monospace; font-size: 8px; text-transform: uppercase; }.repo-line span { padding: 3px 6px; border-radius: 3px; background: rgba(50,128,102,.08); }.repo-line span + span { background: rgba(101,80,165,.08); color: #6550a5; }
.project-header h1 { margin: 0; color: #29343c; font-size: clamp(38px,6vw,58px); letter-spacing: -.065em; line-height: .98; }.project-header p { max-width: 500px; margin: 18px 0 0; color: #68737b; font-size: 14px; line-height: 1.75; }
.project-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 21px; }.project-actions a { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 11px; border: 1px solid rgba(52,63,72,.13); border-radius: 5px; background: rgba(249,249,246,.7); color: #46525a; font-family: 'IBM Plex Mono', monospace; font-size: 9px; }.project-actions a:first-child { border-color: #46525a; background: #374149; color: #f4f5f2; }.project-actions a:hover { transform: translateY(-1px); }
.project-cover { width: 100%; max-height: 380px; margin: 0 0 25px; border-radius: 7px; object-fit: cover; box-shadow: 0 13px 30px rgba(52,60,65,.12); }
.tech-strip { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 0 0 32px; padding: 11px 12px; border-top: 1px dashed rgba(55,66,74,.15); border-bottom: 1px dashed rgba(55,66,74,.15); color: #737e85; font-family: 'IBM Plex Mono', monospace; font-size: 8px; }.tech-strip > span:not(.tech-label) { padding: 3px 6px; border-radius: 3px; background: rgba(57,69,77,.06); }.tech-label { color: #328066; }
.project-content { color: #424f57; font-size: 14px; line-height: 1.95; }.project-content :deep(h2) { margin: 35px 0 13px; color: #2f3b43; font-size: 23px; letter-spacing: -.035em; }.project-content :deep(h3) { color: #344049; }.project-content :deep(p) { margin: 0 0 18px; }.project-content :deep(a) { color: #6550a5; text-decoration: underline; text-underline-offset: 3px; }.project-content :deep(img) { max-width: 100%; margin: 24px 0; border-radius: 6px; }.project-content :deep(pre) { overflow-x: auto; padding: 17px; border-radius: 6px; background: #2f373d; color: #e7e9e8; }.project-content :deep(code) { font-family: 'IBM Plex Mono', monospace; }
</style>
