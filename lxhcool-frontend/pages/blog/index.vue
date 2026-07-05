<script setup lang="ts">
import { listPublicPosts } from '~/entities/post/api/postApi';

const { data: postsData } = await useAsyncData('public-articles', () => listPublicPosts('ARTICLE'));

const posts = computed(() => {
  if (!postsData.value) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load posts' });
  }

  return postsData.value;
});
</script>

<template>
  <main>
    <nav>
      <NuxtLink to="/">Home</NuxtLink>
    </nav>

    <h1>Blog</h1>
    <p v-if="posts.length === 0">No published posts yet.</p>
    <ul v-else>
      <li v-for="post in posts" :key="post.id">
        <NuxtLink :to="`/blog/${post.slug}`">{{ post.title }}</NuxtLink>
        <p v-if="post.excerpt">{{ post.excerpt }}</p>
        <time v-if="post.publishedAt" :datetime="post.publishedAt">{{ post.publishedAt }}</time>
      </li>
    </ul>
  </main>
</template>
