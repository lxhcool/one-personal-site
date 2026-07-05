<script setup lang="ts">
defineProps<{
  title?: string | null;
  config: {
    images: { url: string; alt?: string; caption?: string }[];
  };
}>();
</script>

<template>
  <section class="app-card photo-widget">
    <div class="widget-heading">{{ title || '照片' }}</div>
    <div class="photo-grid">
      <figure v-for="image in config.images" :key="image.url">
        <img :src="image.url" :alt="image.alt || image.caption || ''" />
        <figcaption v-if="image.caption">{{ image.caption }}</figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.photo-widget {
  padding: 16px;
}

.widget-heading {
  margin-bottom: 12px;
  font-weight: 700;
}

.photo-grid {
  display: grid;
  gap: 10px;
}

figure {
  margin: 0;
}

img {
  aspect-ratio: 16 / 10;
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

figcaption {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 12px;
}
</style>
