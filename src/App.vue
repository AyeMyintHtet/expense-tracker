<template>
  <!--
    APP STATE MACHINE:
    1. No PIN set yet         → show PIN setup (blocks everything)
    2. PIN set but locked     → show LockScreen (30 min inactivity)
    3. PIN set and unlocked   → show normal app
  -->

  <!-- STATE 1: First-time setup — no nav, no escape -->
  <TwoFactorAuth
    v-if="appState === 'setup'"
    @pinSaved="handlePinSaved"
  />

  <!-- STATE 2: Locked after inactivity — must re-enter PIN -->
  <LockScreen
    v-else-if="appState === 'locked'"
    @unlocked="handleUnlocked"
  />

  <!-- STATE 3: Normal app — fully accessible -->
  <div v-else class="app-shell">
    <main class="app-content">
      <AppHeader />
      <GreetingSection />
      <BalanceCard 
        :total="total" 
        :percentChange="percentChange" 
      />
      <SpendingTrend :weeklyData="weeklySpending" />
      <RecentActivity 
        :transactions="sortedTransactions" 
        @delete="handleTransactionDeleted"
      />
    </main>

    <!-- Fixed bottom navigation -->
    <BottomNav :activeTab="activeTab" @tabChange="handleTabChange" />

    <!-- Floating action button -->
    <AddButton @click="showAddModal = true" />

    <!-- Add transaction modal -->
    <AddTransactionModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @submit="handleTransactionSubmitted"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useToast } from 'vue-toastification';

import AppHeader from './components/AppHeader.vue';
import GreetingSection from './components/GreetingSection.vue';
import BalanceCard from './components/BalanceCard.vue';
import SpendingTrend from './components/SpendingTrend.vue';
import RecentActivity from './components/RecentActivity.vue';
import BottomNav from './components/BottomNav.vue';
import AddButton from './components/AddButton.vue';
import AddTransactionModal from './components/AddTransactionModal.vue';
import TwoFactorAuth from './components/TwoFactorAuth.vue';
import LockScreen from './components/LockScreen.vue';
import {
  INACTIVITY_TIMEOUT_MS,
  STORAGE_KEYS,
  hasConfiguredPin,
} from './utils/security';

const toast = useToast();
const activeTab = ref('home');
const showAddModal = ref(false);

// ==========================================
// SECURITY: App state machine
// ==========================================
// 'setup'   → first-time PIN creation (blocks all navigation)
// 'locked'  → inactivity timeout, must re-enter PIN
// 'unlocked'→ normal app usage
const appState = ref('setup');

let inactivityTimer = null;
let isTrackingActivity = false;

/**
 * Determines the initial app state based on localStorage.
 * - No saved PIN hash (or legacy PIN) → first-time setup
 * - PIN exists + last_active is stale/missing → locked
 * - PIN exists + recent activity timestamp → unlocked
 */
const resolveInitialState = () => {
  if (!hasConfiguredPin()) {
    // No PIN configured → force setup
    return 'setup';
  }

  const lastActive = Number(localStorage.getItem(STORAGE_KEYS.lastActive));
  if (!Number.isFinite(lastActive) || lastActive <= 0) {
    // PIN exists but no activity timestamp → treat as locked
    return 'locked';
  }

  const elapsed = Date.now() - lastActive;
  if (elapsed > INACTIVITY_TIMEOUT_MS) {
    // Inactive for over 30 minutes → lock
    return 'locked';
  }

  // All good — user was recently active
  return 'unlocked';
};

const lockApp = () => {
  stopActivityTracking();
  showAddModal.value = false;
  appState.value = 'locked';
};

/** Reset the inactivity timer on any user interaction */
const resetInactivityTimer = () => {
  if (appState.value !== 'unlocked') return;

  // Persist the current timestamp so it survives page reloads
  localStorage.setItem(STORAGE_KEYS.lastActive, Date.now().toString());

  // Clear and restart the in-memory timer
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    lockApp();
  }, INACTIVITY_TIMEOUT_MS);
};

/** Start listening for user activity events */
const USER_EVENTS = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
const startActivityTracking = () => {
  if (isTrackingActivity) {
    resetInactivityTimer();
    return;
  }

  USER_EVENTS.forEach((event) => {
    window.addEventListener(event, resetInactivityTimer, { passive: true });
  });
  isTrackingActivity = true;

  // Kick off the first timer
  resetInactivityTimer();
};

const stopActivityTracking = () => {
  if (isTrackingActivity) {
    USER_EVENTS.forEach((event) => {
      window.removeEventListener(event, resetInactivityTimer);
    });
    isTrackingActivity = false;
  }

  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
};

const loadTransactions = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.transactions);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[App] Failed to parse stored transactions:', error);
    return [];
  }
};

const saveTransactions = () => {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions.value));
};

const getDateKey = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const sumTransactionsBetween = (list, startDate, endDate) => {
  return list.reduce((sum, tx) => {
    const txDate = new Date(tx.date);
    if (txDate >= startDate && txDate < endDate) {
      return sum + tx.amount;
    }

    return sum;
  }, 0);
};

const seedTransactions = () => {
  transactions.value = [
    {
      id: 1,
      text: 'Starbucks',
      category: 'Food & Drink',
      icon: 'coffee',
      amount: -5.50,
      date: '2026-04-02T10:24:00',
    },
    {
      id: 2,
      text: 'Apple Music',
      category: 'Subscriptions',
      icon: 'music',
      amount: -9.99,
      date: '2026-04-01T08:00:00',
    },
    {
      id: 3,
      text: 'Lyft',
      category: 'Transport',
      icon: 'car',
      amount: -15.20,
      date: '2026-03-14T14:30:00',
    },
    {
      id: 4,
      text: 'Salary Deposit',
      category: 'Income',
      icon: 'wallet',
      amount: 4500.00,
      date: '2026-03-12T09:00:00',
    },
    {
      id: 5,
      text: 'Netflix',
      category: 'Subscriptions',
      icon: 'tv',
      amount: -15.99,
      date: '2026-03-10T08:00:00',
    },
    {
      id: 6,
      text: 'Grocery Store',
      category: 'Food & Drink',
      icon: 'coffee',
      amount: -87.43,
      date: '2026-03-09T11:00:00',
    },
  ];
  saveTransactions();
};

// ==========================================
// SECURITY: Event handlers
// ==========================================

/** Called when the user finishes setting up their PIN for the first time */
const handlePinSaved = () => {
  appState.value = 'unlocked';
  startActivityTracking();
};

/** Called when the user re-enters the correct PIN from the lock screen */
const handleUnlocked = () => {
  appState.value = 'unlocked';
  startActivityTracking();
};

// ==========================================
// TRANSACTION DATA
// ==========================================
const transactions = ref([]);

onMounted(() => {
  // 1. Resolve security state first
  appState.value = resolveInitialState();

  // 2. If unlocked, start tracking activity
  if (appState.value === 'unlocked') {
    startActivityTracking();
  } else {
    stopActivityTracking();
  }

  // 3. Load transaction data
  const saved = loadTransactions();
  if (saved === null) {
    // Seed with demo data on first run
    seedTransactions();
  } else {
    transactions.value = saved;
  }
});

onBeforeUnmount(() => {
  stopActivityTracking();
});

// Computed values
const normalizedTransactions = computed(() => {
  return transactions.value
    .map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
      date: tx.date ?? new Date().toISOString(),
    }))
    .filter((tx) => Number.isFinite(tx.amount) && !Number.isNaN(new Date(tx.date).getTime()));
});

const sortedTransactions = computed(() => {
  return [...normalizedTransactions.value]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((tx) => ({ ...tx, amount: Number(tx.amount) }));
});

const total = computed(() => {
  return normalizedTransactions.value.reduce((sum, tx) => sum + tx.amount, 0);
});

const percentChange = computed(() => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentMonthTotal = sumTransactionsBetween(
    normalizedTransactions.value,
    currentMonthStart,
    nextMonthStart,
  );
  const previousMonthTotal = sumTransactionsBetween(
    normalizedTransactions.value,
    previousMonthStart,
    currentMonthStart,
  );

  if (previousMonthTotal === 0) {
    return currentMonthTotal === 0 ? 0 : 100;
  }

  const change = ((currentMonthTotal - previousMonthTotal) / Math.abs(previousMonthTotal)) * 100;
  return Number(change.toFixed(1));
});

const weeklySpending = computed(() => {
  const today = new Date();
  const buckets = [];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOffset);
    buckets.push({
      key: getDateKey(date),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      amount: 0,
    });
  }

  const bucketByDateKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  normalizedTransactions.value.forEach((tx) => {
    if (tx.amount >= 0) return;

    const key = getDateKey(tx.date);
    if (!key) return;

    const bucket = bucketByDateKey.get(key);
    if (bucket) {
      bucket.amount += Math.abs(tx.amount);
    }
  });

  return buckets.map(({ day, amount }) => ({
    day,
    amount: Number(amount.toFixed(2)),
  }));
});

// Event handlers
const handleTransactionSubmitted = (data) => {
  const parsedAmount = Number(data.amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
    toast.error('Please enter a valid non-zero amount');
    return;
  }

  transactions.value.push({
    id: Date.now(),
    text: data.text,
    category: data.category || 'General',
    icon: data.icon || 'wallet',
    amount: parsedAmount,
    date: new Date().toISOString(),
  });
  saveTransactions();
  showAddModal.value = false;
  toast.success('Transaction added');
};

const handleTransactionDeleted = (id) => {
  transactions.value = transactions.value.filter(t => t.id !== id);
  saveTransactions();
  toast.success('Transaction removed');
};

const handleTabChange = (tab) => {
  activeTab.value = tab;
};
</script>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding-bottom: calc(var(--nav-height) + 20px);
}

.app-content {
  padding: 0 var(--spacing-lg);
  padding-bottom: var(--spacing-xl);
}
</style>
