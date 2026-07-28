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

      <aside v-if="metaItems?.length || $slots.aside" class="detail-rail">
        <dl v-if="metaItems?.length" class="detail-meta-list">
          <div v-for="item in metaItems" :key="`${item.label ?? 'meta'}-${item.value}`">
            <dt v-if="item.label">{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
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
  width: min(920px, calc(100vw - 32px));
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
  margin: 0 0 26px;
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
  gap: 56px;
  align-items: start;
}

.detail-paper {
  min-width: 0;
  padding: 0 0 72px;
}

.detail-hero {
  position: relative;
  padding: 0 0 34px;
  border-bottom: 1px solid var(--detail-line);
}

.detail-hero::after {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 88px;
  height: 1px;
  background: var(--detail-accent);
  content: '';
}

.detail-kicker {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 16px;
  color: var(--detail-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.detail-kicker span {
  padding: 4px 7px;
  border: 1px solid var(--detail-soft-line);
  border-radius: 999px;
  background: var(--detail-chip);
}

.detail-kicker span:first-child {
  color: var(--detail-accent);
}

.detail-hero h1 {
  max-width: 11ch;
  margin: 0;
  color: var(--detail-ink);
  font-size: clamp(42px, 8vw, 88px);
  font-weight: 760;
  letter-spacing: -.075em;
  line-height: .88;
}

.detail-description {
  max-width: 62ch;
  margin: 24px 0 0;
  color: var(--detail-muted);
  font-size: 15px;
  line-height: 1.85;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 24px;
}

.detail-cover {
  margin: 34px 0;
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

.detail-meta-list {
  display: grid;
  gap: 17px;
  margin: 0;
  font-family: 'IBM Plex Mono', monospace;
}

.detail-meta-list div {
  display: grid;
  gap: 4px;
}

.detail-meta-list dt {
  color: var(--detail-muted);
  font-size: 9px;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.detail-meta-list dd {
  margin: 0;
  color: var(--detail-ink);
  font-size: 11px;
  line-height: 1.55;
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

  .detail-meta-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .detail-frame {
    width: 100%;
  }

  .detail-hero h1 {
    max-width: 12ch;
    font-size: clamp(38px, 16vw, 64px);
  }

  .detail-meta-list {
    grid-template-columns: 1fr;
  }
}
</style>
