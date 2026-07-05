<script setup lang="ts">
import { listPublicWidgets } from '~/entities/widget/api/widgetApi';
import WidgetRenderer from '~/components/widgets/WidgetRenderer.vue';

const theme = useState<'light' | 'dark'>('site-theme', () => 'light');
const { data: widgetsData } = await useAsyncData('public-widgets', () => listPublicWidgets());

onMounted(() => {
  const storedTheme = window.localStorage.getItem('site-theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    theme.value = storedTheme;
  }
  applyTheme();
});

watch(theme, () => applyTheme());

const widgets = computed(() => widgetsData.value ?? []);
const leftWidgets = computed(() => widgets.value.filter((widget) => widget.area === 'LEFT'));
const rightWidgets = computed(() => widgets.value.filter((widget) => widget.area === 'RIGHT'));
const shellClass = computed(() => ({
  'has-left': leftWidgets.value.length > 0,
  'has-right': rightWidgets.value.length > 0,
}));

function applyTheme() {
  if (import.meta.server) return;
  document.documentElement.dataset.theme = theme.value;
  window.localStorage.setItem('site-theme', theme.value);
}
</script>

<template>
  <div class="site-shell" :class="shellClass">
    <aside v-if="leftWidgets.length" class="shell-column shell-column-left">
      <WidgetRenderer v-for="widget in leftWidgets" :key="widget.id" :widget="widget" />
    </aside>

    <main class="content-column">
      <slot />
    </main>

    <aside v-if="rightWidgets.length" class="shell-column shell-column-right">
      <WidgetRenderer v-for="widget in rightWidgets" :key="widget.id" :widget="widget" />
    </aside>
  </div>
</template>

<style scoped>
.site-shell {
  display: grid;
  grid-template-columns: var(--center-column);
  gap: var(--shell-gap);
  width: var(--center-column);
  max-width: calc(100vw - 32px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px 0;
}

.site-shell.has-left {
  grid-template-columns: var(--left-column) var(--center-column);
  width: calc(var(--left-column) + var(--center-column) + var(--shell-gap));
}

.site-shell.has-right {
  grid-template-columns: var(--center-column) var(--right-column);
  width: calc(var(--center-column) + var(--right-column) + var(--shell-gap));
}

.site-shell.has-left.has-right {
  grid-template-columns: var(--left-column) var(--center-column) var(--right-column);
  width: calc(
    var(--left-column) + var(--center-column) + var(--right-column) +
      var(--shell-gap) * 2
  );
}

.shell-column {
  display: grid;
  align-content: start;
  gap: 16px;
}

.shell-column-left,
.shell-column-right {
  position: sticky;
  top: 24px;
  height: fit-content;
}

.content-column {
  min-width: 0;
}

.content-column :deep(main) {
  min-height: 320px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  padding: 24px;
}

@media (max-width: 1220px) {
  .site-shell,
  .site-shell.has-left,
  .site-shell.has-right,
  .site-shell.has-left.has-right {
    grid-template-columns: minmax(0, var(--center-column));
    justify-content: center;
    width: var(--center-column);
  }

  .shell-column-left,
  .shell-column-right {
    display: none;
  }
}

@media (max-width: 680px) {
  .site-shell,
  .site-shell.has-left,
  .site-shell.has-right,
  .site-shell.has-left.has-right {
    max-width: none;
    width: 100%;
    padding: 12px;
  }
}
</style>
