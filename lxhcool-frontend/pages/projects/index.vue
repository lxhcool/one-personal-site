<script setup lang="ts">
import { listPublicProjects } from '~/entities/project/api/projectApi';

const { data: projectsData } = await useAsyncData('public-projects', () => listPublicProjects());

const projects = computed(() => {
  if (!projectsData.value) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load projects' });
  }

  return projectsData.value;
});
</script>

<template>
  <main>
    <nav>
      <NuxtLink to="/">Home</NuxtLink>
    </nav>

    <h1>Projects</h1>
    <p v-if="projects.length === 0">No published projects yet.</p>
    <ul v-else>
      <li v-for="project in projects" :key="project.id">
        <NuxtLink :to="`/projects/${project.slug}`">{{ project.title }}</NuxtLink>
        <p v-if="project.excerpt">{{ project.excerpt }}</p>
      </li>
    </ul>
  </main>
</template>
