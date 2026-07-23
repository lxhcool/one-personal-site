<script setup lang="ts">
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';

defineProps<{
  path: string;
  title?: string;
  status?: string;
}>();

const { adminUrl } = getRequiredPublicRuntimeConfig();
</script>

<template>
  <section class="workbench-window">
    <header class="window-bar">
      <span class="window-controls">
        <span class="control control-close" aria-hidden="true" />
        <span class="control control-minimize" aria-hidden="true" />
        <a
          class="control control-expand control-admin"
          :href="adminUrl"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="在新标签页打开管理后台"
          title="管理后台"
        />
      </span>
      <SiteCommandNav />
      <span class="window-actions">
        <span class="window-status">{{ status || 'online' }}</span>
      </span>
    </header>

    <div class="window-content">
      <header v-if="title || $slots.eyebrow" class="content-heading">
        <div class="content-heading__copy">
          <div v-if="$slots.eyebrow" class="content-eyebrow"><slot name="eyebrow" /></div>
          <h1 v-if="title">{{ title }}</h1>
        </div>
        <div v-if="$slots.headingAside" class="content-heading__aside"><slot name="headingAside" /></div>
      </header>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.workbench-window {
  position: relative;
  display: flex;
  min-height: calc(100vh - 24px);
  min-height: calc(100dvh - 24px);
  flex-direction: column;
  isolation: isolate;
  overflow: clip;
  border: 0;
  border-radius: 9px 9px 0 0;
  background: #fff;
  box-shadow:
    rgba(0, 0, 0, 0) 0 0 0 0,
    rgba(0, 0, 0, 0) 0 0 0 0,
    rgba(11, 15, 19, 0.035) 0 8px 24px 0,
    rgba(11, 15, 19, 0.04) 0 1px 2px 0;
}

.window-bar {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  min-height: 46px;
  padding: 0 12px;
  border-bottom: 1px solid rgba(11, 15, 19, 0.055);
  background: #fff;
  font-family: 'IBM Plex Mono', monospace;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 7px;
}

.control {
  width: 10px;
  height: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35);
}

.control-close { background: #df746c; }
.control-minimize { background: #d8b15d; }
.control-expand { background: #6eaa79; }

.control-admin {
  position: relative;
  display: block;
  transition: box-shadow 140ms ease, transform 140ms ease;
}

.control-admin::before {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  content: '';
}

.control-admin:hover {
  box-shadow:
    0 0 0 3px rgba(110, 170, 121, 0.12),
    inset 0 1px 1px rgba(255, 255, 255, 0.35);
  transform: scale(1.06);
}

.control-admin:focus-visible {
  outline: 2px solid rgba(77, 154, 117, 0.34);
  outline-offset: 3px;
}

.window-status {
  display: inline-flex;
  min-height: 20px;
  align-items: center;
  justify-self: end;
  padding: 0 3px;
  background: transparent;
  color: #87919a;
  font-size: 9px;
  letter-spacing: 0.09em;
  text-align: right;
  text-transform: uppercase;
}

.window-actions {
  display: inline-flex;
  align-items: center;
  justify-self: end;
  gap: 6px;
}

.window-status::before {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 5px;
  border-radius: 50%;
  background: #63a66f;
  box-shadow: 0 0 0 3px rgba(99, 166, 111, 0.08);
  content: '';
  vertical-align: 1px;
}

.window-content {
  flex: 1;
  padding: 30px 32px 34px;
}

.content-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 27px;
}

.content-heading h1 {
  margin: 4px 0 0;
  color: #27313a;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.content-eyebrow,
.content-heading__aside {
  color: #818b93;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 680px) {
  .workbench-window {
    min-height: calc(100vh - 12px);
    min-height: calc(100dvh - 12px);
    border-radius: 9px 9px 0 0;
  }
  .window-bar { grid-template-columns: 54px minmax(0, 1fr) auto; padding: 0 8px; }
  .window-status { display: none; }
  .window-content { padding: 24px 19px 28px; }
  .content-heading { align-items: start; margin-bottom: 22px; }
  .content-heading h1 { font-size: 32px; }
}
</style>
