<template>
  <!--
    APP STATE MACHINE:
    1. No PIN set yet         → show PIN setup (blocks everything)
    2. PIN set but locked     → show LockScreen (30 min inactivity)
    3. PIN set and unlocked   → show normal app
  -->

  <!-- STATE 1: First-time setup — no nav, no escape -->
  <TwoFactorAuth v-if="appState === 'setup'" @pinSaved="handlePinSaved" />

  <!-- STATE 2: Locked after inactivity — must re-enter PIN -->
  <LockScreen v-else-if="appState === 'locked'" @unlocked="handleUnlocked" />

  <!-- STATE 3: Normal app — fully accessible -->
  <div v-else class="app-shell">
    <main class="app-content">
      <AppHeader />

      <!-- Sticky BalanceCard: placed outside the transition so sticky positioning works -->
      <template v-if="activeTab === 'home'">
        <GreetingSection />
        <BalanceCard :total="total" :percentChange="percentChange" :currency="activeCurrency" />
      </template>

      <transition :name="tabDirection === 'forward' ? 'tab-slide-forward' : 'tab-slide-back'" mode="out-in">
        <section :key="activeTab" class="tab-panel">
          <template v-if="activeTab === 'home'">
            <RecentActivity
              :transactions="sortedTransactions"
              :currency="activeCurrency"
              @delete="handleTransactionDeleted"
              @edit="handleTransactionEdit"
            />
          </template>

          <StatsTab
            v-else-if="activeTab === 'stats'"
            :hasTransactions="hasTransactions"
            :summary="currentMonthSummary"
            :percentChange="percentChange"
            :avgDailyExpense="averageDailyExpense"
            :expenseTransactionCount="expenseTransactionCount"
            :weeklyData="weeklySpending"
            :categoryBreakdown="categoryBreakdown"
            :currency="activeCurrency"
          />

          <ReportsTab
            v-else-if="activeTab === 'reports'"
            :hasTransactions="hasTransactions"
            :reports="monthlyReports"
            :largestExpense="largestExpense"
            :largestIncome="largestIncome"
            :currency="activeCurrency"
          />

          <SettingsTab
            v-else-if="activeTab === 'settings'"
            :currency="activeCurrency"
            :currencyOptions="currencyOptions"
            @currencyChange="handleCurrencySaved"
          />
        </section>
      </transition>
    </main>

    <BottomNav :activeTab="navActiveTab" @tabChange="handleTabChange" />

    <AddTransactionModal
      v-if="showAddModal"
      :transaction="editingTransaction"
      :currency="activeCurrency"
      @close="closeAddModal"
      @submit="handleTransactionSubmitted"
      @update="handleTransactionUpdated"
    />

    <CurrencySetupModal
      v-if="showCurrencySetup"
      :currency="activeCurrency"
      :options="currencyOptions"
      @save="handleCurrencySaved"
    />
  </div>

  <PwaUpdateBanner :show="isPwaUpdateAvailable" @update="handlePwaUpdate" @dismiss="dismissPwaUpdate" />
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';

import AppHeader from './components/AppHeader.vue';
import GreetingSection from './components/GreetingSection.vue';
import BalanceCard from './components/BalanceCard.vue';
import RecentActivity from './components/RecentActivity.vue';
import StatsTab from './components/StatsTab.vue';
import ReportsTab from './components/ReportsTab.vue';
import SettingsTab from './components/SettingsTab.vue';
import BottomNav from './components/BottomNav.vue';
import AddTransactionModal from './components/AddTransactionModal.vue';
import TwoFactorAuth from './components/TwoFactorAuth.vue';
import LockScreen from './components/LockScreen.vue';
import PwaUpdateBanner from './components/PwaUpdateBanner.vue';
import CurrencySetupModal from './components/CurrencySetupModal.vue';
import {
  INACTIVITY_TIMEOUT_MS,
  STORAGE_KEYS,
  hasConfiguredPin,
} from './utils/security';
import {
  DEFAULT_CURRENCY,
  getCurrencyOptions,
  getStoredCurrency,
  setStoredCurrency,
} from './utils/currency';
import {
  buildCategoryBreakdown,
  buildMonthlyReports,
  buildWeeklyExpense,
  calculateAverageDailyExpense,
  calculateMonthSummary,
  calculatePercentChangeCurrentVsPreviousMonth,
  calculateTotalBalance,
  findLargestExpense,
  findLargestIncome,
  getMonthExpenseTransactions,
  normalizeTransactions,
  getSortedTransactions,
} from './utils/analytics';

const toast = useToast();
const activeTab = ref('home');
const showAddModal = ref(false);
/** Holds the transaction being edited, or null when creating a new one */
const editingTransaction = ref(null);
const isPwaUpdateAvailable = ref(false);
const waitingServiceWorker = ref(null);
const tabDirection = ref('forward');
const selectedCurrency = ref(getStoredCurrency());
const currencyOptions = getCurrencyOptions('en-US');

const PWA_UPDATE_EVENT = 'spent:pwa-update-available';

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
    // No stored data yet
  } else {
    transactions.value = saved;
  }
  window.addEventListener(PWA_UPDATE_EVENT, handlePwaUpdateAvailable);
});

// Computed values
const normalizedTransactions = computed(() => {
  return normalizeTransactions(transactions.value);
});

const sortedTransactions = computed(() => {
  return getSortedTransactions(normalizedTransactions.value);
});

const total = computed(() => {
  return calculateTotalBalance(normalizedTransactions.value);
});

const percentChange = computed(() => {
  return calculatePercentChangeCurrentVsPreviousMonth(normalizedTransactions.value);
});

const weeklySpending = computed(() => {
  return buildWeeklyExpense(normalizedTransactions.value);
});

const hasTransactions = computed(() => normalizedTransactions.value.length > 0);
const currentMonthSummary = computed(() => calculateMonthSummary(normalizedTransactions.value));
const averageDailyExpense = computed(() => calculateAverageDailyExpense(normalizedTransactions.value));
const expenseTransactionCount = computed(() => {
  return getMonthExpenseTransactions(normalizedTransactions.value).length;
});
const categoryBreakdown = computed(() => buildCategoryBreakdown(normalizedTransactions.value));
const monthlyReports = computed(() => buildMonthlyReports(normalizedTransactions.value, 6));
const largestExpense = computed(() => findLargestExpense(normalizedTransactions.value));
const largestIncome = computed(() => findLargestIncome(normalizedTransactions.value));
const navActiveTab = computed(() => (showAddModal.value ? 'add' : activeTab.value));
const activeCurrency = computed(() => selectedCurrency.value || DEFAULT_CURRENCY);
const showCurrencySetup = computed(() => {
  return appState.value === 'unlocked' && !selectedCurrency.value;
});
const TAB_ORDER = ['home', 'stats', 'reports', 'settings'];

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
  editingTransaction.value = null;
  toast.success('Transaction added');
};

const handleTransactionDeleted = (id) => {
  transactions.value = transactions.value.filter(t => t.id !== id);
  saveTransactions();
  toast.success('Transaction removed');
};

const handleTabChange = (tab) => {
  if (tab === 'add') {
    showAddModal.value = true;
    return;
  }

  const currentIndex = TAB_ORDER.indexOf(activeTab.value);
  const nextIndex = TAB_ORDER.indexOf(tab);

  if (currentIndex !== -1 && nextIndex !== -1) {
    tabDirection.value = nextIndex >= currentIndex ? 'forward' : 'back';
  }

  activeTab.value = tab;

  // Always reset viewport position when moving between tabs.
  nextTick(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });
};

const closeAddModal = () => {
  showAddModal.value = false;
  editingTransaction.value = null;
};

/** Open the modal pre-filled with an existing transaction for editing */
const handleTransactionEdit = (tx) => {
  editingTransaction.value = tx;
  showAddModal.value = true;
};

/** Patch an existing transaction in the array */
const handleTransactionUpdated = (updated) => {
  const idx = transactions.value.findIndex((t) => t.id === updated.id);
  if (idx === -1) return;

  // Preserve original date & id, overwrite the editable fields
  transactions.value[idx] = {
    ...transactions.value[idx],
    text: updated.text,
    amount: updated.amount,
    category: updated.category,
    icon: updated.icon,
  };

  saveTransactions();
  showAddModal.value = false;
  editingTransaction.value = null;
  toast.success('Transaction updated');
};

const handleCurrencySaved = (currencyCode) => {
  const normalized = setStoredCurrency(currencyCode);
  selectedCurrency.value = normalized;
  toast.success(`Currency set to ${normalized}`);
};

const handlePwaUpdateAvailable = (event) => {
  const registration = event?.detail?.registration;
  if (!registration?.waiting) return;

  waitingServiceWorker.value = registration.waiting;
  isPwaUpdateAvailable.value = true;
};

const handlePwaUpdate = () => {
  if (!waitingServiceWorker.value) return;

  sessionStorage.setItem('spent_reload_after_sw_update', '1');
  waitingServiceWorker.value.postMessage({ type: 'SKIP_WAITING' });
  isPwaUpdateAvailable.value = false;
};

const dismissPwaUpdate = () => {
  isPwaUpdateAvailable.value = false;
};

onBeforeUnmount(() => {
  stopActivityTracking();
  window.removeEventListener(PWA_UPDATE_EVENT, handlePwaUpdateAvailable);
});
</script>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 20px);
}

.app-content {
  padding: 0 var(--spacing-lg);
  padding-bottom: var(--spacing-xl);
}

.tab-panel {
  min-height: calc(100vh - var(--nav-height) - env(safe-area-inset-bottom));
}

.tab-slide-forward-enter-active,
.tab-slide-forward-leave-active,
.tab-slide-back-enter-active,
.tab-slide-back-leave-active {
  transition: opacity 240ms ease, transform 240ms ease;
  will-change: transform, opacity;
}

.tab-slide-forward-enter-from,
.tab-slide-back-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.tab-slide-forward-leave-to,
.tab-slide-back-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

@media (prefers-reduced-motion: reduce) {

  .tab-slide-forward-enter-active,
  .tab-slide-forward-leave-active,
  .tab-slide-back-enter-active,
  .tab-slide-back-leave-active {
    transition: none;
  }
}
</style>
