<script setup lang="ts">
import { listPublicFriendLinks } from '~/entities/friend-link/api/friendLinkApi';

const props = defineProps<{
  title?: string | null;
  config: {
    category: string;
    limit: number;
    random: boolean;
  };
}>();

const { data } = await useAsyncData(`widget-friend-links-${props.config.category}`, () =>
  listPublicFriendLinks(),
);

const links = computed(() => {
  const source = data.value ?? [];
  const filtered = props.config.category
    ? source.filter((link) => link.category === props.config.category)
    : source;
  const ordered = props.config.random ? [...filtered].sort(() => Math.random() - 0.5) : filtered;
  return ordered.slice(0, props.config.limit || 6);
});
</script>

<template>
  <section class="app-card friends-widget">
    <div class="widget-heading">{{ title || '友情链接' }}</div>
    <div class="friend-list">
      <a v-for="link in links" :key="link.id" :href="link.url" target="_blank">
        <img v-if="link.logo" :src="link.logo" :alt="link.name" />
        <span v-else>{{ link.name.slice(0, 1) }}</span>
        <strong>{{ link.name }}</strong>
      </a>
    </div>
  </section>
</template>

<style scoped>
.friends-widget {
  padding: 16px;
}

.widget-heading {
  margin-bottom: 12px;
  font-weight: 700;
}

.friend-list {
  display: grid;
  gap: 8px;
}

a {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  padding: 7px;
}

a:hover {
  background: var(--hover-bg);
}

img,
span {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: var(--hover-bg);
  object-fit: cover;
  font-size: 12px;
}

strong {
  font-size: 13px;
}
</style>
