<script setup lang="ts">
import { listPublicFriendLinks } from '~/entities/friend-link/api/friendLinkApi';

const { data: friendLinksData } = await useAsyncData('public-friend-links', () => listPublicFriendLinks());

const friendLinks = computed(() => {
  if (!friendLinksData.value) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load friend links' });
  }

  return friendLinksData.value;
});
</script>

<template>
  <main>
    <nav>
      <NuxtLink to="/">Home</NuxtLink>
    </nav>

    <h1>Friends</h1>
    <p v-if="friendLinks.length === 0">No friend links yet.</p>
    <ul v-else>
      <li v-for="friendLink in friendLinks" :key="friendLink.id">
        <a :href="friendLink.url" target="_blank" rel="noreferrer">{{ friendLink.name }}</a>
        <img v-if="friendLink.logo" :src="friendLink.logo" :alt="friendLink.name" />
        <p v-if="friendLink.description">{{ friendLink.description }}</p>
      </li>
    </ul>
  </main>
</template>
