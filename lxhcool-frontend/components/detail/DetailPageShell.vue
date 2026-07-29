<script setup lang="ts">
type DetailMetaItem = {
  label?: string;
  value: string;
};

defineProps<{
  backLabel: string;
  backTo: string;
  description?: string | null;
  eyebrow: string;
  featured?: boolean;
  metaItems?: DetailMetaItem[];
  title: string;
}>();
</script>

<template>
  <div class="detail-frame">
    <NuxtLink :to="backTo" class="detail-back">{{ backLabel }}</NuxtLink>

    <div class="detail-layout">
      <article class="detail-paper">
        <header class="detail-hero">
          <div class="detail-kicker">
            <span>{{ eyebrow }}</span>
            <span v-if="featured">featured</span>
          </div>
          <h1>{{ title }}</h1>
          <dl v-if="metaItems?.length" class="detail-meta-inline">
            <div v-for="item in metaItems" :key="`${item.label ?? 'meta'}-${item.value}`">
              <dt v-if="item.label">{{ item.label }}</dt>
              <dd>{{ item.value }}</dd>
            </div>
          </dl>
          <p v-if="description" class="detail-description">{{ description }}</p>

          <div v-if="$slots.actions" class="detail-actions">
            <slot name="actions" />
          </div>
        </header>

        <div v-if="$slots.cover" class="detail-cover">
          <slot name="cover" />
        </div>

        <slot />
      </article>

      <aside v-if="$slots.aside" class="detail-rail">
        <slot name="aside" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.detail-frame {
  --detail-ink: var(--text);
  --detail-muted: var(--text-muted);
  --detail-line: color-mix(in oklch, var(--text) 14%, transparent);
  --detail-soft-line: color-mix(in oklch, var(--text) 8%, transparent);
  --detail-surface: color-mix(in oklch, var(--page-bg) 86%, white 14%);
  --detail-chip: color-mix(in oklch, var(--page-bg) 82%, var(--text) 8%);
  --detail-accent: oklch(52% .07 150);
  width: min(884px, calc(100vw - 32px));
  margin-left: 50%;
  color: var(--detail-ink);
  transform: translateX(-50%);
}

:global(:root[data-theme='dark']) .detail-frame {
  --detail-line: color-mix(in oklch, white 16%, transparent);
  --detail-soft-line: color-mix(in oklch, white 9%, transparent);
  --detail-surface: color-mix(in oklch, var(--page-bg) 90%, white 4%);
  --detail-chip: color-mix(in oklch, var(--page-bg) 84%, white 8%);
  --detail-accent: oklch(72% .07 150);
}

.detail-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 18px;
  color: var(--detail-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  letter-spacing: .04em;
}

.detail-back::before {
  content: '←';
}

.detail-back:hover {
  color: var(--detail-ink);
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 680px) 184px;
  gap: 44px;
  align-items: start;
}

.detail-paper {
  min-width: 0;
  padding: 0 0 72px;
}

.detail-hero {
  position: relative;
  padding: 0 0 20px;
  border-bottom: 1px solid var(--detail-line);
}

.detail-kicker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--detail-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.detail-kicker span {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.detail-kicker span:first-child {
  color: var(--detail-muted);
}

.detail-hero h1 {
  max-width: none;
  margin: 0;
  color: var(--detail-ink);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.01em;
  line-height: 1.55;
}

.detail-meta-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin: 10px 0 0;
  color: var(--detail-muted);
  font-family: 'IBM Plex Mono', monospace;
}

.detail-meta-inline div {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
}

.detail-meta-inline dt {
  color: color-mix(in oklch, var(--detail-muted) 72%, transparent);
  font-size: 9px;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.detail-meta-inline dd {
  margin: 0;
  font-size: 10px;
  line-height: 1.5;
}

.detail-description {
  max-width: 62ch;
  margin: 12px 0 0;
  color: var(--detail-muted);
  font-size: 13px;
  line-height: 1.7;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 24px;
}

.detail-cover {
  margin: 22px 0;
}

.detail-rail {
  position: sticky;
  top: 28px;
  display: grid;
  gap: 24px;
  min-width: 0;
  padding-left: 18px;
  border-left: 1px solid var(--detail-line);
}

@media (max-width: 1120px) {
  .detail-frame {
    width: min(680px, calc(100vw - 32px));
  }

  .detail-layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .detail-rail {
    position: static;
    order: -1;
    padding: 15px 0 0;
    border-top: 1px solid var(--detail-line);
    border-left: 0;
  }

}

@media (max-width: 560px) {
  .detail-frame {
    width: 100%;
  }

  .detail-hero h1 {
    max-width: none;
    font-size: 18px;
  }
}
</style>
