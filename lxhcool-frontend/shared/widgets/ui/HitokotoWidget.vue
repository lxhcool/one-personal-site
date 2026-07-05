<script setup lang="ts">
defineProps<{
  title?: string | null;
  config: {
    text: string;
    from: string;
  };
}>();
</script>

<template>
  <section class="app-card hitokoto-card">
    <div class="widget-heading">{{ title || '一言' }}</div>
    <p>{{ config.text || '愿你有前进一寸的勇气。' }}</p>
    <span v-if="config.from">- {{ config.from }}</span>
  </section>
</template>

<style scoped>
.hitokoto-card {
  padding: 16px;
}

.widget-heading {
  margin-bottom: 10px;
  font-weight: 700;
}

p {
  margin: 0;
  line-height: 1.7;
}

span {
  display: block;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
