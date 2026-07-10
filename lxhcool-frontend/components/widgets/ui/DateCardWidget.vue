<script setup lang="ts">
defineProps<{
  widget?: { title?: string | null };
  normalized?: Record<string, unknown>;
}>();

const now = new Date();
const realYear = now.getFullYear();
const realMonth = now.getMonth();
const realDate = now.getDate();

const displayYear = ref(realYear);
const displayMonth = ref(realMonth);

const canPrev = computed(() => {
  return displayYear.value > realYear || (displayYear.value === realYear && displayMonth.value > 0);
});

const canNext = computed(() => {
  return displayYear.value < realYear || (displayYear.value === realYear && displayMonth.value < 11);
});

function prevMonth() {
  if (displayMonth.value === 0) {
    displayYear.value--;
    displayMonth.value = 11;
  } else {
    displayMonth.value--;
  }
}

function nextMonth() {
  if (displayMonth.value === 11) {
    displayYear.value++;
    displayMonth.value = 0;
  } else {
    displayMonth.value++;
  }
}

const isCurrentMonth = computed(() =>
  displayYear.value === realYear && displayMonth.value === realMonth,
);

const monthLabel = computed(() => {
  const d = new Date(displayYear.value, displayMonth.value, 1);
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(d);
});

const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];

const calendarDays = computed(() => {
  const y = displayYear.value;
  const m = displayMonth.value;
  const firstDay = new Date(y, m, 1).getDay();
  const totalDays = new Date(y, m + 1, 0).getDate();

  // Previous month info
  const prevM = m === 0 ? 11 : m - 1;
  const prevY = m === 0 ? y - 1 : y;
  const prevTotalDays = new Date(prevY, prevM + 1, 0).getDate();

  const cells: Array<{ day: number; isToday: boolean; isAdjacent: boolean }> = [];

  // Leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevTotalDays - i, isToday: false, isAdjacent: true });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, isToday: isCurrentMonth.value && d === realDate, isAdjacent: false });
  }

  // Trailing days from next month (fill remaining slots to complete the last row)
  const remaining = (7 - ((firstDay + totalDays) % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, isToday: false, isAdjacent: true });
  }

  return cells;
});
</script>

<template>
  <div class="date-calendar">
    <div class="cal-header">
      <span class="cal-nav" :class="{ disabled: !canPrev }" @click="canPrev && prevMonth()">‹</span>
      <span class="cal-month">{{ monthLabel }}</span>
      <span class="cal-nav" :class="{ disabled: !canNext }" @click="canNext && nextMonth()">›</span>
    </div>

    <div class="cal-grid cal-head-row">
      <span
        v-for="h in dayHeaders"
        :key="h"
        class="cal-head"
        :class="{ 'cal-weekend': h === '六' || h === '日' }"
      >{{ h }}</span>
    </div>

    <div class="cal-grid">
      <span
        v-for="(cell, i) in calendarDays"
        :key="i"
        class="cal-day"
        :class="{
          'cal-adjacent': cell.isAdjacent,
          'cal-today': cell.isToday,
        }"
      >{{ cell.day }}</span>
    </div>
  </div>
</template>

<style scoped>
.date-calendar {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #3a4654;
  padding: 8px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.cal-month {
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.5px;
  min-width: 100px;
}

.cal-nav {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
  color: #9ca3af;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: background 0.12s ease, color 0.12s ease;
  line-height: 1;
}

.cal-nav:hover:not(.disabled) {
  background: rgba(0, 0, 0, 0.08);
  color: #374151;
}

.cal-nav.disabled {
  color: #d1d5db;
  cursor: default;
}

/* ── Calendar Grid ── */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
}

.cal-head-row {
  margin-bottom: 2px;
}

.cal-head {
  padding: 4px 0;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
}

.cal-head.cal-weekend {
  color: #c4a3a3;
}

.cal-day {
  padding: 5px 0;
  border-radius: 4px;
  color: #374151;
  transition: background 0.12s ease;
}

.cal-day.cal-adjacent {
  color: #c4c8cf;
}

.cal-day.cal-today {
  color: #059669;
  font-weight: 700;
  background: rgba(5, 150, 105, 0.1);
}
</style>
