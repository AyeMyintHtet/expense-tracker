<template>
  <section class="reports-tab" aria-label="Monthly reports">
    <div class="tab-header">
      <p class="text-label">Archive</p>
      <h2 class="tab-title">Reports</h2>
    </div>

    <p v-if="!hasTransactions" class="empty-state">
      No reports available yet. Add transactions to generate monthly reports.
    </p>

    <template v-else>
      <section class="highlights" aria-label="Report highlights">
        <article class="highlight-card">
          <p class="highlight-label">Largest Expense</p>
          <p class="highlight-value">
            {{ largestExpense ? formatCurrency(Math.abs(largestExpense.amount)) : '$0.00' }}
          </p>
        </article>

        <article class="highlight-card">
          <p class="highlight-label">Largest Income</p>
          <p class="highlight-value">
            {{ largestIncome ? formatCurrency(largestIncome.amount) : '$0.00' }}
          </p>
        </article>
      </section>

      <ul class="report-list">
        <li v-for="report in reports" :key="report.key" class="report-card">
          <div class="report-head">
            <h3 class="report-month">{{ report.label }}</h3>
            <span class="report-badge" :class="{ negative: report.net < 0 }">
              {{ report.net < 0 ? 'Deficit' : 'Surplus' }} </span>
          </div>

          <div class="report-grid">
            <div class="report-item">
              <p class="item-label">Income</p>
              <p class="item-value item-value--income">{{ formatCurrency(report.income) }}</p>
            </div>
            <div class="report-item">
              <p class="item-label">Expense</p>
              <p class="item-value item-value--expense">{{ formatCurrency(report.expense) }}</p>
            </div>
            <div class="report-item">
              <p class="item-label">Net</p>
              <p class="item-value" :class="{ 'item-value--expense': report.net < 0 }">
                {{ formatSignedCurrency(report.net) }}
              </p>
            </div>
            <div class="report-item">
              <p class="item-label">Count</p>
              <p class="item-value">{{ report.count }}</p>
            </div>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup>
defineProps({
  hasTransactions: {
    type: Boolean,
    required: true,
  },
  reports: {
    type: Array,
    required: true,
  },
  largestExpense: {
    type: Object,
    default: null,
  },
  largestIncome: {
    type: Object,
    default: null,
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
.reports-tab {
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

.highlights {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.highlight-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.highlight-label {
  color: var(--color-text-tertiary);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: var(--spacing-xs);
}

.highlight-value {
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  font-weight: 700;
}

.highlight-meta {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: 0.6875rem;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.report-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.report-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.report-month {
  font-size: 0.9375rem;
  font-weight: 700;
}

.report-badge {
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-dim);
}

.report-badge.negative {
  color: var(--color-expense);
  background: rgba(255, 107, 107, 0.15);
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
}

.item-label {
  color: var(--color-text-tertiary);
  font-size: 0.6875rem;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.item-value {
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 700;
}

.item-value--income {
  color: var(--color-income);
}

.item-value--expense {
  color: var(--color-expense);
}

.empty-state {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
  padding: var(--spacing-sm) 0;
}

@media (max-width: 360px) {

  .highlights,
  .report-grid {
    grid-template-columns: 1fr;
  }
}
</style>
