<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <div class="modal-handle" aria-hidden="true"></div>

        <div class="modal-header">
          <h3 class="modal-title">{{ isEditMode ? 'Edit Transaction' : 'Quick Add' }}</h3>
          <button class="modal-close" @click="$emit('close')" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="type-toggle" role="tablist" aria-label="Transaction type">
            <button type="button" class="type-btn" :class="{ active: txType === 'expense', 'type-btn--expense': true }"
              @click="txType = 'expense'">
              Expense
            </button>
            <button type="button" class="type-btn" :class="{ active: txType === 'income', 'type-btn--income': true }"
              @click="txType = 'income'">
              Income
            </button>
          </div>

          <!-- Transaction name -->
          <div class="form-group">
            <label class="form-label text-label" for="tx-name">Name</label>
            <input id="tx-name" v-model="name" type="text" class="form-input" placeholder="e.g. Coffee, Groceries"
              required autocomplete="off" />
          </div>

          <!-- Amount -->
          <div class="form-group">
            <label class="form-label text-label" for="tx-amount">Amount</label>
            <div class="amount-input-wrap">
              <span class="amount-prefix">{{ currencySymbol }}</span>
              <input id="tx-amount" v-model="amount" type="number" step="0.01" min="0" inputmode="decimal"
                class="form-input amount-input" placeholder="0.00" required />
            </div>

            <div class="quick-amounts">
              <button v-for="preset in quickAmountPresets" :key="preset" type="button" class="quick-amount-btn"
                @click="setQuickAmount(preset)">
                +{{ preset }}
              </button>
            </div>
          </div>

          <!-- Category -->
          <div class="form-group">
            <label class="form-label text-label" for="tx-category">Category</label>
            <div class="category-grid" id="tx-category">
              <button
                v-for="option in categoryOptions"
                :key="option"
                type="button"
                class="category-btn"
                :class="{ active: category === option }"
                @click="category = option"
                @contextmenu.prevent="handleCategoryContext(option)"
              >
                {{ option }}
                <!-- Show remove icon on custom categories -->
                <span
                  v-if="isCustomCategory(option)"
                  class="category-remove"
                  @click.stop="confirmRemoveCategory(option)"
                  title="Remove category"
                >
                  &times;
                </span>
              </button>

              <!-- Add-category trigger (+ pill) -->
              <button
                v-if="!isAddingCategory"
                type="button"
                class="category-btn category-btn--add"
                @click="startAddingCategory"
                title="Add custom category"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              <!-- Inline input for new category -->
              <div v-if="isAddingCategory" class="category-add-input-wrap">
                <input
                  ref="newCategoryInput"
                  v-model="newCategoryName"
                  type="text"
                  class="category-add-input"
                  placeholder="Category name"
                  maxlength="24"
                  @keydown.enter.prevent="addCategory"
                  @keydown.escape="cancelAddCategory"
                />
                <button type="button" class="category-add-confirm" @click="addCategory" :disabled="!newCategoryName.trim()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button type="button" class="category-add-cancel" @click="cancelAddCategory">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <button type="submit" class="submit-btn"
            :class="{ 'submit-btn--expense': txType === 'expense', 'submit-btn--income': txType === 'income' }"
            :disabled="!isValid">
            {{ isEditMode ? 'Save Changes' : `Add ${txType === 'income' ? 'Income' : 'Expense'}` }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { getCurrencySymbol } from '../utils/currency';
import { STORAGE_KEYS } from '../utils/security';

const props = defineProps({
  /** Pass a transaction object to enter edit mode; null/undefined = create mode */
  transaction: {
    type: Object,
    default: null,
  },
  currency: {
    type: String,
    default: 'USD',
  },
});

const emit = defineEmits(['close', 'submit', 'update']);

const name = ref('');
const amount = ref('');
const txType = ref('expense');
const category = ref('Food & Drink');
const quickAmountPresets = [5, 10, 20, 50];

// Default (built-in) categories — cannot be removed by the user
const DEFAULT_CATEGORIES = {
  expense: ['Food & Drink', 'Transport', 'Subscriptions', 'Shopping', 'Debt', 'General'],
  income: ['Salary', 'Freelance', 'Bonus', 'Refund', 'General'],
};

// ==========================================
// CUSTOM CATEGORIES: persisted in localStorage
// ==========================================

/** Load user-created categories from localStorage */
const loadCustomCategories = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customCategories);
    if (!raw) return { expense: [], income: [] };
    const parsed = JSON.parse(raw);
    return {
      expense: Array.isArray(parsed.expense) ? parsed.expense : [],
      income: Array.isArray(parsed.income) ? parsed.income : [],
    };
  } catch {
    return { expense: [], income: [] };
  }
};

/** Persist user-created categories to localStorage */
const saveCustomCategories = () => {
  localStorage.setItem(
    STORAGE_KEYS.customCategories,
    JSON.stringify(customCategories.value),
  );
};

const customCategories = ref(loadCustomCategories());

// UI state for the inline "add category" flow
const isAddingCategory = ref(false);
const newCategoryName = ref('');
const newCategoryInput = ref(null);

/** Check if a category is user-created (not a built-in default) */
const isCustomCategory = (categoryName) => {
  return !DEFAULT_CATEGORIES[txType.value]?.includes(categoryName)
    && customCategories.value[txType.value]?.includes(categoryName);
};

const startAddingCategory = () => {
  isAddingCategory.value = true;
  newCategoryName.value = '';
  // Auto-focus the input after the DOM updates
  nextTick(() => {
    newCategoryInput.value?.focus();
  });
};

const cancelAddCategory = () => {
  isAddingCategory.value = false;
  newCategoryName.value = '';
};

const addCategory = () => {
  const trimmed = newCategoryName.value.trim();
  if (!trimmed) return;

  const type = txType.value;
  const allCurrent = [...DEFAULT_CATEGORIES[type], ...customCategories.value[type]];

  // Prevent duplicates (case-insensitive check)
  if (allCurrent.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    cancelAddCategory();
    return;
  }

  customCategories.value[type].push(trimmed);
  saveCustomCategories();

  // Auto-select the newly created category
  category.value = trimmed;
  cancelAddCategory();
};

/** Remove a custom category (only user-created ones can be removed) */
const confirmRemoveCategory = (categoryName) => {
  if (!isCustomCategory(categoryName)) return;

  const type = txType.value;
  customCategories.value[type] = customCategories.value[type].filter(
    (c) => c !== categoryName,
  );
  saveCustomCategories();

  // If the removed category was selected, fall back to the first available
  if (category.value === categoryName) {
    category.value = DEFAULT_CATEGORIES[type][0];
  }
};

/** Right-click handler: remove custom category */
const handleCategoryContext = (categoryName) => {
  confirmRemoveCategory(categoryName);
};

/** True when editing an existing transaction */
const isEditMode = computed(() => !!props.transaction);

// Merge default + custom categories for the active type
const categoryOptions = computed(() => [
  ...DEFAULT_CATEGORIES[txType.value],
  ...customCategories.value[txType.value],
]);
const currencySymbol = computed(() => getCurrencySymbol(props.currency));

const isValid = computed(() => {
  const parsed = Number(amount.value);
  return name.value.trim().length > 0 && Number.isFinite(parsed) && parsed > 0;
});

// Map category to icon slug
const categoryIcons = {
  'Food & Drink': 'coffee',
  'Transport': 'car',
  'Subscriptions': 'music',
  'Shopping': 'wallet',
  'Salary': 'wallet',
  'Freelance': 'wallet',
  'Bonus': 'wallet',
  'Refund': 'wallet',
  'General': 'wallet',
};

/**
 * Populate form fields from a transaction object.
 * Used on initial mount and whenever the prop changes.
 */
const populateFromTransaction = (tx) => {
  if (!tx) return;

  name.value = tx.text ?? '';
  // Always display amount as a positive number in the input
  amount.value = String(Math.abs(tx.amount));
  txType.value = tx.amount >= 0 ? 'income' : 'expense';
  category.value = tx.category ?? 'General';
};

// Pre-fill on mount if transaction is provided
populateFromTransaction(props.transaction);

// Re-populate if the parent swaps which transaction is being edited
watch(() => props.transaction, (tx) => {
  if (tx) populateFromTransaction(tx);
});

const setQuickAmount = (preset) => {
  amount.value = String(Number(amount.value) + preset);
};

watch(txType, (type) => {
  const options = [...DEFAULT_CATEGORIES[type], ...customCategories.value[type]];
  if (!options.includes(category.value)) {
    category.value = options[0];
  }
  // Close inline input when switching type
  cancelAddCategory();
});

const handleSubmit = () => {
  if (!isValid.value) return;

  const normalized = Number(amount.value);
  const signedAmount = txType.value === 'income' ? normalized : -normalized;

  const payload = {
    text: name.value.trim(),
    amount: signedAmount,
    category: category.value,
    icon: categoryIcons[category.value] || 'wallet',
  };

  if (isEditMode.value) {
    // Emit update with the original id so the parent can patch the right entry
    emit('update', { ...payload, id: props.transaction.id });
  } else {
    emit('submit', payload);

    // Only reset form after a create, not an edit
    name.value = '';
    amount.value = '';
    txType.value = 'expense';
    category.value = 'Food & Drink';
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  width: 100%;
  max-width: 430px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: var(--spacing-lg);
  padding-bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom) + 8px);
  animation: fadeInUp 0.3s ease;
}

.modal-handle {
  width: 42px;
  height: 5px;
  border-radius: 999px;
  background: var(--color-surface-hover);
  margin: 0 auto var(--spacing-sm);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
}

.modal-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  margin-bottom: 2px;
}

.type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  background: var(--color-surface-elevated);
}

.type-btn {
  min-height: 38px;
  border-radius: calc(var(--radius-md) - 3px);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.type-btn.active {
  color: #0A0A0A;
}

.type-btn--income.active {
  background: var(--color-primary);
}

.type-btn--expense.active {
  background: var(--color-expense);
}

.form-input {
  width: 100%;
  padding: 14px var(--spacing-md);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 0.9375rem;
  outline: none;
  transition: border-color var(--transition-fast);
  appearance: none;
  -webkit-appearance: none;
}

.amount-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

/* Inherit focus ring from the inner input */
.amount-input-wrap:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
}

.amount-prefix {
  padding-left: 14px;
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  pointer-events: none;
  /* Prevents prefix from shrinking when the input is wide */
  flex-shrink: 0;
}

/* Remove duplicate border/bg since the wrapper handles it */
.amount-input {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  flex: 1;
  min-width: 0;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
}

.form-input::placeholder {
  color: var(--color-text-tertiary);
}

.quick-amounts {
  margin-top: var(--spacing-xs);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-xs);
}

.quick-amount-btn {
  min-height: 34px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.quick-amount-btn:hover {
  color: var(--color-primary);
  border-color: rgba(0, 255, 171, 0.4);
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  align-items: center;
}

.category-btn {
  position: relative;
  min-height: 34px;
  border-radius: 999px;
  padding: 0 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.category-btn.active {
  border-color: rgba(0, 255, 171, 0.45);
  color: var(--color-primary);
  background: var(--color-primary-dim);
}

/* "+" button to add a new category */
.category-btn--add {
  border-style: dashed;
  border-color: var(--color-text-tertiary);
  color: var(--color-text-tertiary);
  padding: 0 10px;
  cursor: pointer;
}

.category-btn--add:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-dim);
}

/* "×" remove badge on custom categories */
.category-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 0.7rem;
  line-height: 1;
  background: rgba(255, 107, 107, 0.15);
  color: var(--color-expense);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-left: 2px;
}

.category-remove:hover {
  background: rgba(255, 107, 107, 0.35);
  transform: scale(1.15);
}

/* Inline input wrapper for adding a category */
.category-add-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  animation: fadeIn 0.15s ease;
}

.category-add-input {
  width: 120px;
  height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--color-primary);
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 0.75rem;
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-dim);
  transition: border-color var(--transition-fast);
}

.category-add-input::placeholder {
  color: var(--color-text-tertiary);
}

.category-add-confirm,
.category-add-cancel {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.category-add-confirm {
  color: var(--color-primary);
  background: var(--color-primary-dim);
}

.category-add-confirm:hover:not(:disabled) {
  background: rgba(0, 255, 171, 0.3);
}

.category-add-confirm:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.category-add-cancel {
  color: var(--color-text-tertiary);
  background: var(--color-surface-hover);
}

.category-add-cancel:hover {
  color: var(--color-expense);
  background: rgba(255, 107, 107, 0.15);
}

.submit-btn {
  width: 100%;
  padding: 16px;
  color: #0A0A0A;
  font-size: 0.9375rem;
  font-weight: 700;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  margin-top: var(--spacing-sm);
}

.submit-btn--income {
  background: var(--color-primary);
}

.submit-btn--expense {
  background: var(--color-expense);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.submit-btn--income:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(0, 255, 171, 0.35);
}

.submit-btn--expense:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.35);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
