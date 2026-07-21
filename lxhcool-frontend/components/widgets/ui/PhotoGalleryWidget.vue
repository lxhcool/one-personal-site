<script setup lang="ts">
import type { SiteWidget } from '~/entities/widget/model/types';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';
import { createThumbnailUrl, resolvePublicImageUrl } from '~/shared/media/imageSources';

type GalleryImage = {
  url: string;
  alt?: string;
  caption?: string;
  slot?: number;
};

const props = defineProps<{
  widget: SiteWidget;
  normalized: Record<string, unknown>;
}>();

const { publicApiBaseUrl } = getRequiredPublicRuntimeConfig();
const { open: openImagePreview } = useImagePreview();

const images = computed(() => {
  if (!Array.isArray(props.normalized.images)) return [];
  return (props.normalized.images as GalleryImage[])
    .filter((image) => typeof image?.url === 'string' && image.url.trim())
    .slice(0, 49)
    .map((image, index) => ({
      ...image,
      slot:
        Number.isInteger(image.slot) && Number(image.slot) >= 0 && Number(image.slot) < 49
          ? Number(image.slot)
          : index,
      url: resolvePublicImageUrl(image.url, publicApiBaseUrl),
      thumbnail: createThumbnailUrl(image.url, publicApiBaseUrl, { width: 160, height: 160, fit: 'cover' }),
    }));
});

const wallSlots = computed(() => {
  return Array.from({ length: 49 }, (_, slot) => {
    const rotation = ((slot * 7) % 5 - 2) * 0.65;
    const shiftX = ((slot * 11) % 3 - 1) * 1.2;
    const shiftY = ((slot * 5) % 3 - 1) * 1.1;
    return {
      slot,
      image: images.value.find((image) => image.slot === slot) ?? null,
      rotation,
      shiftX,
      shiftY,
    };
  });
});

function previewImage(image: GalleryImage & { thumbnail: string }) {
  const previewImages = images.value.map((item) => ({
    src: item.url,
    alt: item.alt,
    caption: item.caption,
  }));
  const index = images.value.findIndex((item) => item.url === image.url);
  openImagePreview(previewImages, Math.max(index, 0));
}
</script>

<template>
  <section v-if="images.length" class="photo-wall" :aria-label="widget.title || '相册'">
    <div class="photo-wall__perspective">
      <div class="photo-wall__grid">
        <button
          v-for="item in wallSlots"
          :key="item.slot"
          type="button"
          class="photo-tile"
          :class="{ 'photo-tile--empty': !item.image }"
          :disabled="!item.image"
          :style="{
            '--tile-rotation': `${item.rotation}deg`,
            '--tile-shift-x': `${item.shiftX}px`,
            '--tile-shift-y': `${item.shiftY}px`,
          }"
          :aria-label="item.image ? item.image.caption || item.image.alt || `查看第 ${item.slot + 1} 格照片` : `第 ${item.slot + 1} 格为空`"
          @click="item.image && previewImage(item.image)"
        >
          <span class="photo-tile__body" aria-hidden="true"></span>
          <span class="photo-tile__face">
            <img
              v-if="item.image"
              :src="item.image.thumbnail"
              :alt="item.image.alt || item.image.caption || ''"
              loading="lazy"
              decoding="async"
            />
            <span class="photo-tile__shine" aria-hidden="true"></span>
          </span>
        </button>
      </div>
    </div>
  </section>

</template>

<style scoped>
.photo-wall {
  width: 360px;
  color: #3a4654;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, Monaco, monospace;
}

.photo-wall__perspective {
  padding: 16px 14px 28px;
}

.photo-wall__grid {
  display: grid;
  grid-template-columns: repeat(7, 42px);
  grid-template-rows: repeat(7, 42px);
  gap: 6px;
  transform: rotate(18deg);
  transform-origin: center;
}

.photo-tile {
  position: relative;
  width: 42px;
  height: 42px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
  contain: paint;
  transform: translate(var(--tile-shift-x), var(--tile-shift-y)) rotate(var(--tile-rotation));
  transition: transform 140ms ease;
}

.photo-tile__body,
.photo-tile__face {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
  border-radius: 5px;
}

.photo-tile__body {
  background: linear-gradient(145deg, #e0e4e6 0%, #b9c0c4 100%);
  box-shadow:
    2px 3px 0 rgba(112, 122, 129, 0.58),
    3px 5px 8px rgba(72, 82, 90, 0.16);
}

.photo-tile__face {
  inset: 2px;
  background: #dce1e3;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.38),
    0 1px 2px rgba(39, 48, 55, 0.08);
}

.photo-tile__face img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.photo-tile__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.3), transparent 34%, rgba(21, 30, 37, 0.08));
  pointer-events: none;
}

.photo-tile:hover,
.photo-tile:focus-visible {
  z-index: 2;
  outline: none;
  transform: translate(var(--tile-shift-x), calc(var(--tile-shift-y) - 3px)) rotate(var(--tile-rotation)) scale(1.05);
}

.photo-tile--empty {
  cursor: default;
}

.photo-tile--empty .photo-tile__face {
  inset: 4px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.48), rgba(196, 205, 211, 0.3)),
    rgba(218, 224, 227, 0.36);
  box-shadow: 0 2px 7px rgba(72, 82, 90, 0.08);
  opacity: 0.5;
}

.photo-tile--empty .photo-tile__body {
  background: rgba(207, 215, 220, 0.24);
  box-shadow: 2px 3px 7px rgba(72, 82, 90, 0.07);
  opacity: 0.48;
}

.photo-tile--empty .photo-tile__shine {
  opacity: 0.16;
}

.photo-tile--empty:hover {
  z-index: auto;
  transform: translate(var(--tile-shift-x), var(--tile-shift-y)) rotate(var(--tile-rotation));
}

.photo-tile:focus-visible .photo-tile__face {
  box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.24), 0 4px 10px rgba(47, 58, 66, 0.14);
}

@media (prefers-reduced-motion: reduce) {
  .photo-tile {
    transition: none;
  }
}
</style>
