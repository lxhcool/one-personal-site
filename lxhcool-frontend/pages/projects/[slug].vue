<script setup lang="ts">
import { getPublicProject } from '~/entities/project/api/projectApi';

const route = useRoute();
const slug = String(route.params.slug);
const { data: projectData } = await useAsyncData(`public-project-${slug}`, () => getPublicProject(slug));

const project = computed(() => {
  if (!projectData.value) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' });
  }

  return projectData.value;
});

useSeoMeta({
  title: () => project.value.seoTitle ?? project.value.title,
  description: () => project.value.seoDescription ?? project.value.excerpt ?? undefined,
  ogImage: () => project.value.ogImage ?? project.value.coverImage ?? undefined,
});
</script>

<template>
  <main>
    <nav>
      <NuxtLink to="/">Home</NuxtLink>
      <NuxtLink to="/projects">Projects</NuxtLink>
    </nav>

    <article>
      <h1>{{ project.title }}</h1>
      <time v-if="project.publishedAt" :datetime="project.publishedAt">{{ project.publishedAt }}</time>
      <img v-if="project.coverImage" :src="project.coverImage" :alt="project.title" />
      <p v-if="project.excerpt">{{ project.excerpt }}</p>
      <pre v-if="project.content">{{ project.content }}</pre>
      <p v-if="project.liveUrl">
        <a :href="project.liveUrl" target="_blank" rel="noreferrer">Live</a>
      </p>
      <p v-if="project.githubUrl">
        <a :href="project.githubUrl" target="_blank" rel="noreferrer">GitHub</a>
      </p>
      <ul v-if="project.techStack.length > 0">
        <li v-for="tech in project.techStack" :key="tech">{{ tech }}</li>
      </ul>
    </article>
  </main>
</template>
