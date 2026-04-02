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
        :class="{ revealing: draggingId === tx.id || openSwipeId === tx.id }"
        :style="{ animationDelay: `${0.4 + index * 0.08}s` }"
      >
        <button
          class="tx-remove-btn"
          type="button"
          :aria-label="`Remove ${tx.text}`"
          @click="handleRemove(tx.id)"
        >
          Remove
        </button>

        <div
          class="tx-card"
          :class="{ swiping: draggingId === tx.id, open: openSwipeId === tx.id }"
          :style="{ transform: `translateX(${getTranslateX(tx.id)}px)` }"
          @pointerdown="handlePointerDown(tx.id, $event)"
          @pointermove="handlePointerMove(tx.id, $event)"
          @pointerup="handlePointerEnd(tx.id, $event)"
          @pointercancel="handlePointerCancel"
          @pointerleave="handlePointerLeave(tx.id, $event)"
          @click="handleCardTap(tx.id)"
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
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

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
const openSwipeId = ref(null);
const draggingId = ref(null);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragDeltaX = ref(0);
const hasHorizontalIntent = ref(false);
const activePointerId = ref(null);
const skipCardTapForId = ref(null);

const SWIPE_REVEAL_WIDTH = 88;
const SWIPE_OPEN_THRESHOLD = 44;
const DRAG_INTENT_THRESHOLD = 6;
const TAP_SUPPRESSION_DISTANCE = 8;

const canToggleView = computed(() => {
  return props.transactions.length > props.initialLimit;
});

const displayedTransactions = computed(() => {
  if (showAll.value) return props.transactions;
  return props.transactions.slice(0, props.initialLimit);
});

watch(displayedTransactions, (items) => {
  if (openSwipeId.value && !items.some((item) => item.id === openSwipeId.value)) {
    openSwipeId.value = null;
  }
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getTranslateX = (id) => {
  const base = openSwipeId.value === id ? -SWIPE_REVEAL_WIDTH : 0;
  if (draggingId.value !== id) return base;
  return clamp(base + dragDeltaX.value, -SWIPE_REVEAL_WIDTH, 0);
};

const resetDrag = () => {
  draggingId.value = null;
  dragDeltaX.value = 0;
  hasHorizontalIntent.value = false;
  activePointerId.value = null;
};

const shouldHandlePointerStart = (event) => {
  if (!event.isPrimary) return false;
  return !(event.pointerType === 'mouse' && event.button !== 0);
};

const capturePointer = (event) => {
  if (typeof event.currentTarget?.setPointerCapture === 'function') {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
};

const releasePointer = (event) => {
  if (
    typeof event.currentTarget?.hasPointerCapture === 'function' &&
    event.currentTarget.hasPointerCapture(event.pointerId)
  ) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
};

const handlePointerDown = (id, event) => {
  if (!shouldHandlePointerStart(event)) return;

  draggingId.value = id;
  activePointerId.value = event.pointerId;
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  dragDeltaX.value = 0;
  hasHorizontalIntent.value = false;

  if (openSwipeId.value && openSwipeId.value !== id) {
    openSwipeId.value = null;
  }

  capturePointer(event);
};

const handlePointerMove = (id, event) => {
  if (draggingId.value !== id || activePointerId.value !== event.pointerId) return;

  const deltaX = event.clientX - dragStartX.value;
  const deltaY = event.clientY - dragStartY.value;

  if (!hasHorizontalIntent.value) {
    if (Math.abs(deltaX) < DRAG_INTENT_THRESHOLD && Math.abs(deltaY) < DRAG_INTENT_THRESHOLD) return;
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      releasePointer(event);
      resetDrag();
      return;
    }
    hasHorizontalIntent.value = true;
  }

  if (event.cancelable) event.preventDefault();
  dragDeltaX.value = deltaX;
};

const handlePointerEnd = (id, event) => {
  if (draggingId.value !== id || activePointerId.value !== event.pointerId) return;

  const movedDistance = Math.abs(dragDeltaX.value);
  const finalOffset = getTranslateX(id);
  openSwipeId.value = finalOffset <= -SWIPE_OPEN_THRESHOLD ? id : null;
  if (movedDistance > TAP_SUPPRESSION_DISTANCE) {
    skipCardTapForId.value = id;
  }
  releasePointer(event);
  resetDrag();
};

const handlePointerCancel = (event) => {
  if (activePointerId.value !== null && activePointerId.value !== event.pointerId) return;
  releasePointer(event);
  resetDrag();
};

const handlePointerLeave = (id, event) => {
  if (
    event.pointerType === 'mouse' &&
    draggingId.value === id &&
    activePointerId.value === event.pointerId
  ) {
    handlePointerEnd(id, event);
  }
};

const handleCardTap = (id) => {
  if (skipCardTapForId.value === id) {
    skipCardTapForId.value = null;
    return;
  }
  if (openSwipeId.value === id && draggingId.value === null) {
    openSwipeId.value = null;
  }
};

const handleRemove = (id) => {
  openSwipeId.value = null;
  emit('delete', id);
};

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
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.transaction-item:last-child {
  border-bottom: none;
}

.tx-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  position: relative;
  z-index: 1;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), background var(--transition-fast);
  touch-action: pan-y;
}

.tx-card.swiping {
  transition: none;
}

.tx-card.open,
.tx-card:hover {
  background: var(--color-surface);
  padding-left: var(--spacing-sm);
  padding-right: var(--spacing-sm);
}

.tx-remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 88px;
  background: var(--color-expense);
  color: #FFFFFF;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease;
}

.transaction-item.revealing .tx-remove-btn {
  opacity: 1;
  pointer-events: auto;
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
}
</style>
