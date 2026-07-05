<script setup lang="ts">
const props = defineProps<{
  title?: string | null;
  config: {
    showTime: boolean;
    siteStartDate: string;
  };
}>();

const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

const dateText = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(now.value),
);

const timeText = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now.value),
);

const runningDays = computed(() => {
  if (!props.config.siteStartDate) return null;
  const start = new Date(props.config.siteStartDate);
  if (Number.isNaN(start.getTime())) return null;
  return Math.max(1, Math.ceil((now.value.getTime() - start.getTime()) / 86400000));
});
</script>

<template>
  <section class="app-card date-card">
    <div class="widget-heading">{{ title || '日期' }}</div>
    <strong>{{ dateText }}</strong>
    <p v-if="config.showTime">{{ timeText }}</p>
    <span v-if="runningDays">站点运行第 {{ runningDays }} 天</span>
  </section>
</template>

<style scoped>
.date-card {
  padding: 16px;
}

.widget-heading {
  margin-bottom: 10px;
  font-weight: 700;
}

strong {
  font-size: 18px;
}

p,
span {
  display: block;
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
