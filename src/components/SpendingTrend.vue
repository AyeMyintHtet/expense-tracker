<template>
  <section class="spending-trend" aria-label="Spending trend chart">
    <div class="trend-header">
      <h3 class="trend-title">Spending Trend</h3>
      <span class="trend-period text-label">LAST 7 DAYS</span>
    </div>

    <div class="chart-container">
      <!-- Tooltip for the highlighted bar -->
      <div
        v-if="highlightedIndex !== null"
        class="chart-tooltip"
        :style="tooltipPosition"
      >
        {{ formatTooltipAmount(weeklyData[highlightedIndex].amount) }}
      </div>

      <div class="chart-bars">
        <div
          v-for="(item, index) in weeklyData"
          :key="item.day"
          class="bar-wrapper"
          @mouseenter="highlightedIndex = index"
          @mouseleave="highlightedIndex = maxIndex"
        >
          <div
            class="bar"
            :class="{ highlighted: index === highlightedIndex }"
            :style="{ height: getBarHeight(item.amount) + '%' }"
          ></div>
          <span class="bar-label">{{ item.day }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { formatCurrency } from '../utils/currency';

const props = defineProps({
  weeklyData: {
    type: Array,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
});

// Find the day with max spending to highlight by default (THU in the screenshot)
const maxIndex = computed(() => {
  if (props.weeklyData.length === 0) return null;

  let maxI = 0;
  let maxVal = 0;
  props.weeklyData.forEach((item, i) => {
    if (item.amount > maxVal) {
      maxVal = item.amount;
      maxI = i;
    }
  });
  return maxI;
});

const highlightedIndex = ref(null);

// Scale bars relative to the max value
const maxAmount = computed(() => {
  if (props.weeklyData.length === 0) return 0;
  return Math.max(...props.weeklyData.map((d) => d.amount));
});

/**
 * Returns a percentage height for the bar, with a minimum
 * so even zero-value bars remain visible.
 */
const getBarHeight = (amount) => {
  const minHeight = 15;
  if (maxAmount.value <= 0) return minHeight;

  const scaled = (amount / maxAmount.value) * 100;
  return Math.max(scaled, minHeight);
};

const formatTooltipAmount = (amount) => {
  return formatCurrency(amount, props.currency);
};

// Position the tooltip above the highlighted bar
const tooltipPosition = computed(() => {
  if (highlightedIndex.value === null) return {};
  // Each bar takes 1/7 of the width; center the tooltip
  const barWidthPercent = 100 / props.weeklyData.length;
  const left = barWidthPercent * highlightedIndex.value + barWidthPercent / 2;
  return { left: `${left}%` };
});

watch(
  maxIndex,
  (newMaxIndex) => {
    highlightedIndex.value = newMaxIndex;
  },
  { immediate: true },
);
</script>

<style scoped>
.spending-trend {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  animation: fadeInUp 0.5s ease both;
  animation-delay: 0.3s;
}

.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.trend-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.trend-period {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.chart-container {
  position: relative;
  padding-top: var(--spacing-xl);
}

.chart-tooltip {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: #0A0A0A;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  animation: scaleIn 0.2s ease;
  z-index: 2;
}

/* Small triangle under tooltip */
.chart-tooltip::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--color-primary);
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 140px;
  gap: var(--spacing-sm);
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.bar {
  width: 100%;
  max-width: 36px;
  border-radius: 6px 6px 4px 4px;
  background: var(--color-surface-hover);
  transition: all var(--transition-smooth);
  transform-origin: bottom;
  animation: barGrow 0.6s ease both;
  position: relative;
}

/* Each bar gets a staggered animation */
.bar-wrapper:nth-child(1) .bar { animation-delay: 0.35s; }
.bar-wrapper:nth-child(2) .bar { animation-delay: 0.4s; }
.bar-wrapper:nth-child(3) .bar { animation-delay: 0.45s; }
.bar-wrapper:nth-child(4) .bar { animation-delay: 0.5s; }
.bar-wrapper:nth-child(5) .bar { animation-delay: 0.55s; }
.bar-wrapper:nth-child(6) .bar { animation-delay: 0.6s; }
.bar-wrapper:nth-child(7) .bar { animation-delay: 0.65s; }

.bar.highlighted {
  background: linear-gradient(180deg, var(--color-primary) 0%, rgba(0, 255, 171, 0.6) 100%);
  box-shadow: 0 0 24px var(--color-primary-dim),
              0 4px 16px rgba(0, 255, 171, 0.2);
}

.bar-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.bar-wrapper:hover .bar-label {
  color: var(--color-text-secondary);
}
</style>
