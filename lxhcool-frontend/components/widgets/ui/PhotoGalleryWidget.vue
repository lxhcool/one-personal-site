<script setup lang="ts">
import type { SiteWidget } from '~/entities/widget/model/types';

defineProps<{
  widget: SiteWidget;
  normalized: Record<string, unknown>;
}>();
</script>

<template>
  <div v-if="Array.isArray(normalized.images)" class="gallery-card">
    <div class="widget-heading">{{ widget.title || '照片' }}</div>
    <div class="gallery-grid">
      <figure v-for="image in normalized.images" :key="image.url" class="gallery-item">
        <img :src="image.url" :alt="image.alt || image.caption || ''" loading="lazy" />
        <figcaption v-if="image.caption">{{ image.caption }}</figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.gallery-card {
  padding: 16px 18px 18px;
}

.gallery-grid {
  display: grid;
  gap: 8px;
}

.gallery-item {
  margin: 0;
}

.gallery-item img {
  aspect-ratio: 16 / 10;
  width: 100%;
  border-radius: var(--radius-sm);
  object-fit: cover;
  transition: transform 0.2s ease;
}

.gallery-item:hover img {
  transform: scale(1.02);
}

figcaption {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
