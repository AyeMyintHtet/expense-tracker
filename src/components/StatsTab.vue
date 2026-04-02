<template>
  <section class="stats-tab" aria-label="Statistics">
    <div class="tab-header">
      <p class="text-label">Performance</p>
      <h2 class="tab-title">Stats</h2>
    </div>

    <p v-if="!hasTransactions" class="empty-state">
      No transaction data yet. Add entries to unlock analytics.
    </p>

    <template v-else>
      <div class="stats-grid">
        <article class="stat-card">
          <p class="stat-label">Net This Month</p>
          <p class="stat-value" :class="{ negative: summary.net < 0 }">
            {{ formatSignedCurrency(summary.net) }}
          </p>
          <p class="stat-hint">{{ percentChange }}% vs last month</p>
        </article>

        <article class="stat-card">
          <p class="stat-label">Avg Daily Spend</p>
          <p class="stat-value">{{ formatCurrency(avgDailyExpense) }}</p>
          <p class="stat-hint">{{ expenseTransactionCount }} expense transactions this month</p>
        </article>

        <article class="stat-card stat-card--income">
          <p class="stat-label">Income</p>
          <p class="stat-value">{{ formatCurrency(summary.income) }}</p>
        </article>

        <article class="stat-card stat-card--expense">
          <p class="stat-label">Expenses</p>
          <p class="stat-value">{{ formatCurrency(summary.expense) }}</p>
        </article>
      </div>


      <section class="category-card" aria-label="Top spending categories">
        <div class="category-head">
          <h3 class="category-title">Top Categories</h3>
          <span class="category-meta">This month</span>
        </div>

        <ul v-if="categoryBreakdown.length" class="category-list">
          <li v-for="item in categoryBreakdown" :key="item.category" class="category-item">
            <div class="category-row">
              <span class="category-name">{{ item.category }}</span>
              <span class="category-amount">{{ formatCurrency(item.amount) }}</span>
            </div>
            <div class="category-bar-track">
              <span class="category-bar-fill" :style="{ width: `${item.percent}%` }"></span>
            </div>
          </li>
        </ul>

        <p v-else class="empty-inline">No expense categories tracked yet this month.</p>
      </section>
    </template>
  </section>
</template>

<script setup>

defineProps({
  hasTransactions: {
    type: Boolean,
    required: true,
  },
  summary: {
    type: Object,
    required: true,
  },
  percentChange: {
    type: Number,
    required: true,
  },
  avgDailyExpense: {
    type: Number,
    required: true,
  },
  expenseTransactionCount: {
    type: Number,
    required: true,
  },
  weeklyData: {
    type: Array,
    required: true,
  },
  categoryBreakdown: {
    type: Array,
    required: true,
  },
});

const formatCurrency = (amount) => {
  return `$${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatSignedCurrency = (amount) => {
  if (amount < 0) {
    return `-${formatCurrency(Math.abs(amount))}`;
  }
  return formatCurrency(amount);
};
</script>

<style scoped>
.stats-tab {
  animation: fadeIn 0.3s ease;
}

.tab-header {
  padding: var(--spacing-sm) 0 var(--spacing-md);
}

.tab-title {
  font-size: 1.625rem;
  font-weight: 700;
  line-height: 1.2;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.stat-card--income .stat-value {
  color: var(--color-income);
}

.stat-card--expense .stat-value {
  color: var(--color-expense);
}

.stat-label {
  color: var(--color-text-tertiary);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-value.negative {
  color: var(--color-expense);
}

.stat-hint {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: 0.6875rem;
}

.category-card {
  margin-top: var(--spacing-xl);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
}

.category-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.category-title {
  font-size: 1rem;
  font-weight: 700;
}

.category-meta {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.category-name {
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.category-amount {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.category-bar-track {
  height: 8px;
  border-radius: 999px;
  background: var(--color-surface-hover);
  overflow: hidden;
}

.category-bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), rgba(0, 255, 171, 0.45));
}

.empty-state,
.empty-inline {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
  padding: var(--spacing-sm) 0;
}

@media (max-width: 360px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
