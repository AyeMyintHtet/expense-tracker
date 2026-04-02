<template>
  <section class="balance-card" aria-label="Total balance">
    <p class="balance-label">Total Balance</p>
    <h2 class="balance-amount" :class="{ 'balance-amount--negative': total < 0, 'balance-amount--positive': total >= 0 }">{{ formattedTotal }}</h2>
    <div class="balance-change">
      <span class="change-badge" :class="{ negative: percentChange < 0 }">
        <svg 
          v-if="percentChange >= 0" 
          width="12" height="12" viewBox="0 0 24 24" 
          fill="none" stroke="currentColor" 
          stroke-width="2.5" stroke-linecap="round"
        >
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
        <svg 
          v-else 
          width="12" height="12" viewBox="0 0 24 24" 
          fill="none" stroke="currentColor" 
          stroke-width="2.5" stroke-linecap="round"
        >
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
        {{ Math.abs(percentChange) }}%
      </span>
      <span class="change-context">vs last month</span>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  total: { type: Number, required: true },
  percentChange: { type: Number, default: 0 },
});

// Format as currency with commas and 2 decimals
const formattedTotal = computed(() => {
  const abs = Math.abs(props.total);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return props.total < 0 ? `-$${formatted}` : `$${formatted}`;
});
</script>

<style scoped>
.balance-card {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg) var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  animation: scaleIn 0.5s ease both;
  animation-delay: 0.2s;
  overflow: hidden;
}

/* Subtle gradient overlay for depth */
.balance-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 255, 171, 0.04) 0%,
    transparent 50%
  );
  pointer-events: none;
}

.balance-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  opacity: 0.8;
  margin-bottom: var(--spacing-sm);
  position: relative;
}

.balance-amount {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: var(--spacing-md);
  position: relative;
  transition: color var(--transition-fast);
}

.balance-amount--positive {
  color: var(--color-income);
}

.balance-amount--negative {
  color: var(--color-expense);
}

.balance-change {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  position: relative;
}

.change-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: var(--color-primary-dim);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.change-badge.negative {
  background: rgba(255, 107, 107, 0.15);
  color: var(--color-expense);
}

.change-context {
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
}
</style>
