<script setup lang="ts">
defineProps<{
  title?: string | null;
  config: {
    avatar: string;
    name: string;
    bio: string;
    socials: { platform: string; label: string; url: string }[];
  };
}>();
</script>

<template>
  <section class="app-card profile-widget">
    <img v-if="config.avatar" class="profile-avatar" :src="config.avatar" :alt="config.name" />
    <div class="widget-heading">{{ title || config.name || '个人信息' }}</div>
    <p v-if="config.bio">{{ config.bio }}</p>
    <div v-if="config.socials.length" class="socials">
      <a v-for="social in config.socials" :key="social.url" :href="social.url" target="_blank">
        {{ social.label || social.platform }}
      </a>
    </div>
  </section>
</template>

<style scoped>
.profile-widget {
  padding: 16px;
  text-align: center;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  margin: 0 auto 12px;
  border-radius: 999px;
  object-fit: cover;
}

.widget-heading {
  font-weight: 700;
}

p {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.socials a {
  border-radius: 999px;
  background: var(--hover-bg);
  padding: 5px 9px;
  font-size: 12px;
}
</style>
