<template>
  <section class="recent-activity" aria-label="Recent transactions">
    <div class="activity-header">
      <h3 class="activity-title">Recent Activity</h3>
      <button
        v-if="canToggleView"
        class="view-all-btn"
        @click="toggleViewMode"
      >
        {{ showAll ? 'SHOW LESS' : 'VIEW ALL' }}
      </button>
    </div>

    <p v-if="displayedTransactions.length === 0" class="empty-state">
      No transactions yet. Add one to get started.
    </p>

    <ul v-else class="transaction-list">
      <li
        v-for="(tx, index) in displayedTransactions"
        :key="tx.id"
        class="transaction-item stagger-enter"
        :style="{ animationDelay: `${0.4 + index * 0.08}s` }"
      >
        <div class="tx-left">
          <div class="tx-icon" :class="`icon-${tx.icon}`">
            <!-- Coffee / Food & Drink -->
            <svg v-if="tx.icon === 'coffee'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="2" x2="6" y2="4"/>
              <line x1="10" y1="2" x2="10" y2="4"/>
              <line x1="14" y1="2" x2="14" y2="4"/>
            </svg>
            <!-- Music -->
            <svg v-else-if="tx.icon === 'music'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <!-- Car / Transport -->
            <svg v-else-if="tx.icon === 'car'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/>
              <path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <!-- Wallet / Income -->
            <svg v-else-if="tx.icon === 'wallet'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M2 10h20"/>
              <circle cx="17" cy="14" r="1"/>
            </svg>
            <!-- TV / Subscriptions -->
            <svg v-else-if="tx.icon === 'tv'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
              <polyline points="17 2 12 7 7 2"/>
            </svg>
            <!-- Default fallback -->
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>

          <div class="tx-info">
            <span class="tx-name">{{ tx.text }}</span>
            <span class="tx-meta">{{ tx.category }} • {{ formatDate(tx.date) }}</span>
          </div>
        </div>

        <div class="tx-right">
          <span class="tx-amount" :class="{ income: tx.amount > 0 }">
            {{ formatAmount(tx.amount) }}
          </span>

          <button
            class="tx-delete-btn"
            :aria-label="`Delete ${tx.text}`"
            @click="emit('delete', tx.id)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  transactions: {
    type: Array,
    required: true,
  },
  initialLimit: {
    type: Number,
    default: 4,
  },
});

const emit = defineEmits(['delete']);

const showAll = ref(false);

const canToggleView = computed(() => {
  return props.transactions.length > props.initialLimit;
});

const displayedTransactions = computed(() => {
  if (showAll.value) return props.transactions;
  return props.transactions.slice(0, props.initialLimit);
});

const toggleViewMode = () => {
  showAll.value = !showAll.value;
};

/**
 * Formats the transaction amount with sign and currency.
 * Expenses show as "-$5.50", income as "+$4,500.00"
 */
const formatAmount = (amount) => {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-$${formatted}` : `+$${formatted}`;
};

/**
 * Formats date relative to today:
 * - Today → shows time like "10:24 AM"
 * - Yesterday → "Yesterday"
 * - Otherwise → "Feb 14" style
 */
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (date >= yesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};
</script>

<style scoped>
.recent-activity {
  animation: fadeInUp 0.5s ease both;
  animation-delay: 0.4s;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.activity-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.view-all-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.04em;
  padding: 6px 0;
  transition: opacity var(--transition-fast);
}

.view-all-btn:hover {
  opacity: 0.7;
}

.empty-state {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  padding: var(--spacing-md) 0;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
  border-radius: var(--radius-sm);
  cursor: default;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-item:hover {
  background: var(--color-surface);
  padding-left: var(--spacing-sm);
  padding-right: var(--spacing-sm);
}

.tx-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.tx-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.tx-icon:hover {
  transform: scale(1.05);
}

/* Icon color variants based on category */
.icon-coffee {
  background: rgba(0, 255, 171, 0.1);
  color: var(--color-primary);
}

.icon-music {
  background: rgba(167, 139, 250, 0.12);
  color: #A78BFA;
}

.icon-car {
  background: rgba(96, 165, 250, 0.12);
  color: #60A5FA;
}

.icon-wallet {
  background: rgba(55, 133, 95, 0.2);
  color: var(--color-secondary);
}

.icon-tv {
  background: rgba(251, 146, 60, 0.12);
  color: #FB923C;
}

.tx-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tx-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.tx-meta {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.tx-amount {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.tx-amount.income {
  color: var(--color-primary);
}

.tx-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.tx-delete-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: all var(--transition-fast);
}

.transaction-item:hover .tx-delete-btn {
  opacity: 1;
}

.tx-delete-btn:hover {
  color: var(--color-expense);
  background: rgba(255, 107, 107, 0.1);
}
</style>
