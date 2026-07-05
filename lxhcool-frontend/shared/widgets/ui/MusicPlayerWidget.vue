<script setup lang="ts">
defineProps<{
  title?: string | null;
  config: {
    defaultTitle: string;
    defaultArtist: string;
    cover: string;
  };
}>();
</script>

<template>
  <section class="app-card widget-card">
    <div class="widget-heading">{{ title || '音乐播放器' }}</div>
    <div class="music-row">
      <div class="music-cover">
        <img v-if="config.cover" :src="config.cover" alt="" />
        <span v-else>♪</span>
      </div>
      <div>
        <strong>{{ config.defaultTitle || '暂无播放' }}</strong>
        <p>{{ config.defaultArtist || '文章音乐会在这里接管播放' }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.widget-card {
  padding: 16px;
}

.widget-heading {
  margin-bottom: 12px;
  font-weight: 700;
}

.music-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.music-cover {
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: var(--hover-bg);
  font-weight: 700;
}

.music-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
