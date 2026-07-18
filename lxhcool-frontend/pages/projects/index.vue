<script setup lang="ts">
import { ArrowUpRight, Folder } from '@lucide/vue';
import { listPublicProjects } from '~/entities/project/api/projectApi';

const { data: projectsData } = await useAsyncData('public-projects', () => listPublicProjects());
const projects = computed(() => {
  if (!projectsData.value) throw createError({ statusCode: 500, statusMessage: 'Failed to load projects' });
  return projectsData.value;
});
</script>

<template>
  <main>
    <WorkbenchWindow path="~/projects" :status="`${projects.length} repos`">
      <p class="project-command"><span>~/projects $</span> tree -L 1</p>
      <div v-if="projects.length" class="project-list">
        <NuxtLink v-for="project in projects" :key="project.id" :to="`/projects/${project.slug}`" class="project-row">
          <span class="folder-icon"><Folder :size="19" stroke-width="1.5" /></span>
          <span class="project-copy">
            <strong>{{ project.title }}</strong>
            <span>{{ project.excerpt || '打开项目档案' }}</span>
            <small>{{ project.techStack.join(' · ') || '未标记技术栈' }}</small>
          </span>
          <span v-if="project.featured" class="featured">featured</span>
          <ArrowUpRight :size="16" class="project-arrow" />
        </NuxtLink>
      </div>
      <div v-else class="project-empty">项目目录还是空的。</div>
    </WorkbenchWindow>
  </main>
</template>

<style scoped>
.project-command { margin: -7px 0 21px; color: #858e95; font-family: 'IBM Plex Mono', monospace; font-size: 9px; }.project-command span { color: #328066; }
.project-list { display: grid; gap: 10px; }
.project-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto 18px; gap: 13px; align-items: center; padding: 17px; border: 1px solid rgba(105, 91, 72, 0.12); border-radius: 7px; background: rgba(238, 233, 223, 0.62); box-shadow: 0 5px 13px rgba(80, 67, 50, 0.035); transition: transform 150ms ease, box-shadow 150ms ease; }
.project-row:hover { transform: translateY(-2px) rotate(-0.15deg); box-shadow: 0 10px 23px rgba(54, 62, 65, 0.075); }
.folder-icon { display: grid; width: 40px; height: 36px; place-items: center; border-radius: 5px; background: linear-gradient(145deg, #e6e8e6, #d2d7d7); color: #59666f; box-shadow: inset 0 1px rgba(255,255,255,.6), 2px 3px 5px rgba(57,68,75,.1); }
.project-copy { display: grid; gap: 5px; min-width: 0; }.project-copy strong { color: #35414a; font-size: 14px; }.project-copy > span { overflow: hidden; color: #747f86; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.project-copy small { color: #899198; font-family: 'IBM Plex Mono', monospace; font-size: 8px; }
.featured { padding: 3px 6px; border-radius: 3px; background: rgba(101,80,165,.08); color: #6550a5; font-family: 'IBM Plex Mono', monospace; font-size: 7px; text-transform: uppercase; }.project-arrow { color: #9aa1a6; }.project-empty { padding: 70px 20px; color: #7f888f; font-size: 12px; text-align: center; }
@media (max-width: 520px) { .project-row { grid-template-columns: 38px minmax(0,1fr) 16px; padding: 13px; }.featured { display: none; }.folder-icon { width: 36px; height: 34px; } }
</style>
