<script setup lang="ts">
const visible = ref(false);

function updateVisibility() {
  visible.value = window.scrollY > 520;
}

function scrollToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

onMounted(() => {
  updateVisibility();
  window.addEventListener('scroll', updateVisibility, { passive: true });
});

onBeforeUnmount(() => window.removeEventListener('scroll', updateVisibility));
</script>

<template>
  <Transition name="back-to-top">
    <button
      v-if="visible"
      type="button"
      class="back-to-top"
      aria-label="回到文章顶部"
      title="回到顶部"
      @click="scrollToTop"
    >↑</button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: max(18px, calc((100vw - var(--center-column)) / 2 - 56px));
  bottom: 24px;
  z-index: 30;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid rgba(105, 91, 72, 0.22);
  border-radius: 7px;
  background: rgba(225, 217, 203, 0.52);
  box-shadow: 5px 7px 16px rgba(91, 72, 48, 0.1);
  backdrop-filter: blur(5px);
  color: #667177;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 17px;
  line-height: 1;
  transition: color 140ms ease, background 140ms ease, transform 140ms ease;
}

.back-to-top:hover {
  background: rgba(235, 228, 215, 0.78);
  color: #6550a5;
  transform: translateY(-3px);
}

.back-to-top:focus-visible {
  outline: 2px solid rgba(101, 80, 165, 0.38);
  outline-offset: 3px;
}

.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 680px) {
  .back-to-top { right: 16px; bottom: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .back-to-top,
  .back-to-top-enter-active,
  .back-to-top-leave-active { transition: none; }
}
</style>
