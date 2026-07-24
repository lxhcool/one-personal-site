<script setup lang="ts">
defineProps<{
  path: string;
  title?: string;
  status?: string;
}>();
</script>

<template>
  <section class="workbench-window">
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
  min-height: calc(100vh - 76px);
  min-height: calc(100dvh - 76px);
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
    min-height: calc(100vh - 66px);
    min-height: calc(100dvh - 66px);
    border-radius: 9px 9px 0 0;
  }
  .window-content { padding: 24px 19px 28px; }
  .content-heading { align-items: start; margin-bottom: 22px; }
  .content-heading h1 { font-size: 32px; }
}
</style>
