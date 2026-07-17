<script setup lang="ts">
defineProps<{
  path: string;
  title?: string;
  status?: string;
}>();
</script>

<template>
  <section class="workbench-window">
    <header class="window-bar">
      <span class="window-controls" aria-hidden="true">
        <span class="control control-close" />
        <span class="control control-minimize" />
        <span class="control control-expand" />
      </span>
      <span class="window-path">lxhcool@desk:{{ path }}</span>
      <span class="window-status">{{ status || 'online' }}</span>
    </header>

    <SiteCommandNav />

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
  isolation: isolate;
  overflow: clip;
  border: 1px solid var(--paper-border);
  border-radius: 9px;
  background:
    linear-gradient(145deg, rgba(255, 250, 240, 0.1), transparent 38%),
    var(--paper-surface);
  box-shadow:
    14px 18px 34px rgba(91, 72, 48, 0.075),
    3px 5px 9px rgba(76, 64, 48, 0.045),
    inset -1px -1px 0 rgba(92, 78, 59, 0.06),
    inset 1px 1px 0 rgba(255, 251, 241, 0.38);
  backdrop-filter: blur(2.5px) saturate(0.86);
}

.window-bar {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr) 82px;
  align-items: center;
  min-height: 38px;
  padding: 0 13px;
  border-bottom: 1px solid rgba(105, 91, 72, 0.12);
  background:
    linear-gradient(180deg, rgba(247, 241, 230, 0.58), rgba(211, 204, 192, 0.42)),
    rgba(224, 217, 205, 0.62);
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

.window-path {
  overflow: hidden;
  color: #65707a;
  font-size: 10px;
  letter-spacing: 0.02em;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-status {
  color: #87919a;
  font-size: 9px;
  letter-spacing: 0.09em;
  text-align: right;
  text-transform: uppercase;
}

.window-status::before {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 5px;
  border-radius: 50%;
  background: #63a66f;
  box-shadow: 0 0 0 3px rgba(99, 166, 111, 0.1);
  content: '';
  vertical-align: 1px;
}

.window-content {
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
  .workbench-window { border-radius: 9px; }
  .window-bar { grid-template-columns: 58px minmax(0, 1fr) 58px; padding: 0 10px; }
  .window-status { font-size: 0; }
  .window-content { padding: 24px 19px 28px; }
  .content-heading { align-items: start; margin-bottom: 22px; }
  .content-heading h1 { font-size: 32px; }
}
</style>
