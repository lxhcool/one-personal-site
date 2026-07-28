<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue';
import { marked } from 'marked';
import { getPublicProject } from '~/entities/project/api/projectApi';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';

const route = useRoute();
const slug = String(route.params.slug);
const { publicApiBaseUrl } = getRequiredPublicRuntimeConfig();
const { data: projectData } = await useAsyncData(`public-project-${slug}`, () => getPublicProject(slug));

const project = computed(() => {
  if (!projectData.value) throw createError({ statusCode: 404, statusMessage: 'Project not found' });
  return projectData.value;
});
const renderedContent = computed(() => marked.parse(project.value.content || '', { async: false }) as string);
const coverImage = computed(() => resolveAssetUrl(project.value.coverImage));
const projectMetaItems = computed(() => [
  { label: 'status', value: project.value.featured ? 'featured' : 'public' },
  ...(project.value.techStack.length > 0 ? [{ label: 'stack', value: `${project.value.techStack.length} items` }] : []),
  ...(project.value.liveUrl ? [{ label: 'live', value: 'available' }] : []),
  ...(project.value.githubUrl ? [{ label: 'source', value: 'available' }] : []),
]);

useSeoMeta({
  title: () => project.value.seoTitle ?? project.value.title,
  description: () => project.value.seoDescription ?? project.value.excerpt ?? undefined,
  ogImage: () => project.value.ogImage ?? coverImage.value ?? undefined,
});

function resolveAssetUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  return `${publicApiBaseUrl}${url}`;
}
</script>

<template>
  <main>
    <DetailPageShell
      back-label="返回项目目录"
      back-to="/projects"
      :description="project.excerpt"
      eyebrow="project / case"
      :featured="project.featured"
      :meta-items="projectMetaItems"
      :title="project.title"
    >
      <template v-if="project.liveUrl || project.githubUrl" #actions>
        <a v-if="project.liveUrl" class="project-action primary" :href="project.liveUrl" target="_blank" rel="noreferrer">
          访问项目 <ArrowUpRight :size="14" />
        </a>
        <a v-if="project.githubUrl" class="project-action" :href="project.githubUrl" target="_blank" rel="noreferrer">
          <span aria-hidden="true">&lt;/&gt;</span> 源代码
        </a>
      </template>

      <template v-if="coverImage" #cover>
        <img class="project-cover" :src="coverImage" :alt="project.title" />
      </template>

      <section v-if="project.techStack.length" class="tech-strip" aria-label="技术栈">
        <span class="tech-label">stack</span>
        <span v-for="tech in project.techStack" :key="tech">{{ tech }}</span>
      </section>

      <DetailRichContent v-if="project.content" :html="renderedContent" />
    </DetailPageShell>
  </main>
</template>

<style scoped>
.project-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid color-mix(in oklch, var(--text) 14%, transparent);
  border-radius: 999px;
  background: color-mix(in oklch, var(--page-bg) 82%, var(--text) 6%);
  color: var(--text);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  transition: background 140ms ease, transform 140ms ease;
}

.project-action.primary {
  border-color: var(--text);
  background: var(--text);
  color: var(--page-bg);
}

.project-action:hover {
  transform: translateY(-1px);
}

.project-cover {
  display: block;
  width: 100%;
  max-height: 460px;
  border-radius: 18px;
  object-fit: cover;
}

.tech-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  margin: 0 0 34px;
  padding: 13px 0;
  border-top: 1px solid color-mix(in oklch, var(--text) 12%, transparent);
  border-bottom: 1px solid color-mix(in oklch, var(--text) 12%, transparent);
  color: var(--text-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
}

.tech-strip > span:not(.tech-label) {
  padding: 4px 7px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--page-bg) 80%, var(--text) 7%);
}

.tech-label {
  color: color-mix(in oklch, var(--text) 74%, oklch(62% .08 150));
  letter-spacing: .08em;
  text-transform: uppercase;
}
</style>
