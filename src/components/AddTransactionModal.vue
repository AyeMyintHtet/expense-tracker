<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <div class="modal-handle" aria-hidden="true"></div>

        <div class="modal-header">
          <h3 class="modal-title">Quick Add</h3>
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
              <span class="amount-prefix">$</span>
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
              <button v-for="option in categoryOptions" :key="option" type="button" class="category-btn"
                :class="{ active: category === option }" @click="category = option">
                {{ option }}
              </button>
            </div>
          </div>

          <button type="submit" class="submit-btn"
            :class="{ 'submit-btn--expense': txType === 'expense', 'submit-btn--income': txType === 'income' }"
            :disabled="!isValid">
            Add {{ txType === 'income' ? 'Income' : 'Expense' }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const emit = defineEmits(['close', 'submit']);

const name = ref('');
const amount = ref('');
const txType = ref('expense');
const category = ref('Food & Drink');
const quickAmountPresets = [5, 10, 20, 50];

const categoriesByType = {
  expense: ['Food & Drink', 'Transport', 'Subscriptions', 'Shopping', 'Debt', 'General'],
  income: ['Salary', 'Freelance', 'Bonus', 'Refund', 'General'],
};

const categoryOptions = computed(() => categoriesByType[txType.value]);

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

const setQuickAmount = (preset) => {
  amount.value = String(preset);
};

watch(txType, (type) => {
  const options = categoriesByType[type];
  if (!options.includes(category.value)) {
    category.value = options[0];
  }
});

const handleSubmit = () => {
  if (!isValid.value) return;

  const normalized = Number(amount.value);
  const signedAmount = txType.value === 'income' ? normalized : -normalized;

  emit('submit', {
    text: name.value.trim(),
    amount: signedAmount,
    category: category.value,
    icon: categoryIcons[category.value] || 'wallet',
  });

  // Reset form
  name.value = '';
  amount.value = '';
  txType.value = 'expense';
  category.value = 'Food & Drink';
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
  -webkit-appearance: none;
}

.amount-input-wrap {
  position: relative;
}

.amount-prefix {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.amount-input {
  padding-left: 32px;
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
}

.category-btn {
  min-height: 34px;
  border-radius: 999px;
  padding: 0 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  transition: all var(--transition-fast);
}

.category-btn.active {
  border-color: rgba(0, 255, 171, 0.45);
  color: var(--color-primary);
  background: var(--color-primary-dim);
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
