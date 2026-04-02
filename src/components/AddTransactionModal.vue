<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Add Transaction</h3>
          <button class="modal-close" @click="$emit('close')" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- Transaction name -->
          <div class="form-group">
            <label class="form-label text-label" for="tx-name">Name</label>
            <input
              id="tx-name"
              v-model="name"
              type="text"
              class="form-input"
              placeholder="e.g. Coffee, Groceries"
              required
              autocomplete="off"
            />
          </div>

          <!-- Amount -->
          <div class="form-group">
            <label class="form-label text-label" for="tx-amount">Amount</label>
            <input
              id="tx-amount"
              v-model="amount"
              type="number"
              step="0.01"
              class="form-input"
              placeholder="Enter amount (negative for expense)"
              required
            />
            <span class="form-hint">Use negative for expenses, positive for income</span>
          </div>

          <!-- Category -->
          <div class="form-group">
            <label class="form-label text-label" for="tx-category">Category</label>
            <select id="tx-category" v-model="category" class="form-input">
              <option value="Food & Drink">Food & Drink</option>
              <option value="Transport">Transport</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Shopping">Shopping</option>
              <option value="Income">Income</option>
              <option value="General">General</option>
            </select>
          </div>

          <button type="submit" class="submit-btn" :disabled="!isValid">
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['close', 'submit']);

const name = ref('');
const amount = ref('');
const category = ref('Food & Drink');

const isValid = computed(() => {
  return name.value.trim().length > 0 && amount.value !== '' && !isNaN(Number(amount.value));
});

// Map category to icon slug
const categoryIcons = {
  'Food & Drink': 'coffee',
  'Transport': 'car',
  'Subscriptions': 'music',
  'Shopping': 'wallet',
  'Income': 'wallet',
  'General': 'wallet',
};

const handleSubmit = () => {
  if (!isValid.value) return;

  emit('submit', {
    text: name.value.trim(),
    amount: Number(amount.value),
    category: category.value,
    icon: categoryIcons[category.value] || 'wallet',
  });

  // Reset form
  name.value = '';
  amount.value = '';
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
  padding-bottom: calc(var(--spacing-2xl) + 20px);
  animation: fadeInUp 0.3s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
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
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  margin-bottom: 2px;
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

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
}

.form-input::placeholder {
  color: var(--color-text-tertiary);
}

/* Style the select dropdown */
select.form-input {
  cursor: pointer;
}

.form-hint {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: var(--color-primary);
  color: #0A0A0A;
  font-size: 0.9375rem;
  font-weight: 700;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  margin-top: var(--spacing-sm);
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(0, 255, 171, 0.35);
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
