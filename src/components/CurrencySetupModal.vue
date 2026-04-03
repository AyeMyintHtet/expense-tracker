<template>
  <Teleport to="body">
    <div class="currency-overlay">
      <div class="currency-modal">
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-header__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <div>
            <h3 class="modal-title">Choose Your Currency</h3>
            <p class="modal-subtitle">
              Select one currency now. All balances and transactions will use it throughout the app.
            </p>
          </div>
        </div>

        <!-- Custom dropdown picker (mirrors SettingsTab design) -->
        <div ref="pickerRef" class="picker">
          <button
            id="currency-setup-trigger"
            type="button"
            class="picker__trigger"
            :class="{ 'picker__trigger--open': isDropdownOpen }"
            :aria-expanded="isDropdownOpen ? 'true' : 'false'"
            aria-haspopup="listbox"
            @click="toggleDropdown"
          >
            <div class="picker__trigger-left">
              <span class="picker__trigger-symbol">{{ selectedOption?.symbol || '¤' }}</span>
              <div class="picker__trigger-text">
                <span class="picker__trigger-code">{{ selectedOption?.code || selectedCurrency }}</span>
                <span class="picker__trigger-name">{{ selectedOption?.name || 'Select currency' }}</span>
              </div>
            </div>

            <svg class="picker__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>

          <!-- Dropdown panel -->
          <transition name="dropdown">
            <div v-if="isDropdownOpen" class="picker__panel" role="dialog" aria-label="Currency picker">
              <!-- Search -->
              <div class="picker__search-wrap">
                <svg class="picker__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref="searchInputRef"
                  v-model.trim="searchQuery"
                  type="text"
                  class="picker__search"
                  placeholder="Search currencies…"
                  autocomplete="off"
                  @keydown.esc.prevent="closeDropdown"
                />
              </div>

              <!-- Option list -->
              <ul v-if="filteredOptions.length" class="picker__list" role="listbox">
                <li v-for="option in filteredOptions" :key="option.code">
                  <button
                    type="button"
                    class="picker__option"
                    :class="{ 'picker__option--selected': option.code === selectedCurrency }"
                    @click="selectCurrency(option.code)"
                  >
                    <span class="picker__option-symbol">{{ option.symbol }}</span>

                    <div class="picker__option-text">
                      <span class="picker__option-code">{{ option.code }}</span>
                      <span class="picker__option-name">{{ option.name }}</span>
                    </div>

                    <!-- Checkmark for selected -->
                    <svg
                      v-if="option.code === selectedCurrency"
                      class="picker__option-check"
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </li>
              </ul>

              <!-- Empty state -->
              <div v-else class="picker__empty">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p>No currencies match "<strong>{{ searchQuery }}</strong>"</p>
              </div>
            </div>
          </transition>
        </div>

        <!-- Save button -->
        <button
          type="button"
          class="save-btn"
          :disabled="!selectedCurrency"
          @click="handleSave"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Save Currency
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  currency: {
    type: String,
    default: 'USD',
  },
  options: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['save']);

const selectedCurrency = ref(props.currency);
const searchQuery = ref('');
const isDropdownOpen = ref(false);
const pickerRef = ref(null);
const searchInputRef = ref(null);

// Sync selection when parent currency changes externally
watch(
  () => props.currency,
  (nextCurrency) => {
    selectedCurrency.value = nextCurrency;
  },
);

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;

  const query = searchQuery.value.toLowerCase();
  return props.options.filter((option) => {
    return (
      option.code.toLowerCase().includes(query) ||
      option.name.toLowerCase().includes(query) ||
      option.symbol.toLowerCase().includes(query)
    );
  });
});

const selectedOption = computed(() => {
  return props.options.find((option) => option.code === selectedCurrency.value) || null;
});

const openDropdown = async () => {
  isDropdownOpen.value = true;
  await nextTick();
  searchInputRef.value?.focus();
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
  searchQuery.value = '';
};

const toggleDropdown = () => {
  if (isDropdownOpen.value) {
    closeDropdown();
    return;
  }
  openDropdown();
};

const selectCurrency = (currencyCode) => {
  selectedCurrency.value = currencyCode;
  closeDropdown();
};

const handleSave = () => {
  if (!selectedCurrency.value) return;
  emit('save', selectedCurrency.value);
};

/** Close dropdown when clicking outside the picker area */
const handlePointerDownOutside = (event) => {
  if (!isDropdownOpen.value) return;
  if (pickerRef.value?.contains(event.target)) return;
  closeDropdown();
};

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDownOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDownOutside);
});
</script>

<style scoped>
/* ==========================================
   MODAL OVERLAY
   ========================================== */
.currency-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease;
}

/* ==========================================
   MODAL CONTAINER
   ========================================== */
.currency-modal {
  width: 100%;
  max-width: 420px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  animation: scaleIn 0.25s ease;

  /* Match SettingsTab card style */
  background:
    linear-gradient(160deg, rgba(0, 255, 171, 0.03) 0%, transparent 40%),
    var(--color-surface);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 4px 24px rgba(0, 0, 0, 0.2);
}

/* ==========================================
   HEADER
   ========================================== */
.modal-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.modal-header__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-primary-dim);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.modal-subtitle {
  margin-top: 4px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* ==========================================
   CUSTOM DROPDOWN — Picker
   (Same design as SettingsTab currency picker)
   ========================================== */
.picker {
  position: relative;
  margin-top: var(--spacing-lg);
}

/* --- Trigger button --- */
.picker__trigger {
  width: 100%;
  min-height: 58px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-primary);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);

  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background var(--transition-fast);
}

.picker__trigger:hover {
  border-color: rgba(255, 255, 255, 0.12);
  background: var(--color-surface-elevated);
}

.picker__trigger--open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
  background: var(--color-surface-elevated);
}

.picker__trigger-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* Currency symbol badge inside trigger */
.picker__trigger-symbol {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(0, 255, 171, 0.15), rgba(0, 255, 171, 0.05));
  color: var(--color-primary);
  font-size: 0.6rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.picker__trigger-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.picker__trigger-code {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.picker__trigger-name {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Chevron rotates on open */
.picker__chevron {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.picker__trigger--open .picker__chevron {
  transform: rotate(180deg);
  color: var(--color-primary);
}

/* --- Dropdown panel --- */
.picker__panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 50;

  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 255, 171, 0.12);
  overflow: hidden;

  /* Glassmorphic background */
  background: rgba(18, 18, 18, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  box-shadow:
    0 -8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

/* --- Search --- */
.picker__search-wrap {
  position: relative;
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.picker__search-icon {
  position: absolute;
  top: 50%;
  left: 22px;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.picker__search {
  width: 100%;
  padding: 11px 12px 11px 36px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 0.8125rem;
  outline: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.picker__search::placeholder {
  color: var(--color-text-tertiary);
}

.picker__search:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
}

/* --- Option list --- */
.picker__list {
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;

  scrollbar-width: thin;
  scrollbar-color: var(--color-surface-hover) transparent;
}

.picker__list::-webkit-scrollbar {
  width: 4px;
}

.picker__list::-webkit-scrollbar-track {
  background: transparent;
  margin: 6px 0;
}

.picker__list::-webkit-scrollbar-thumb {
  background: var(--color-surface-hover);
  border-radius: 2px;
}

/* --- Option button --- */
.picker__option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
}

.picker__option:hover {
  background: rgba(255, 255, 255, 0.04);
}

.picker__option:active {
  transform: scale(0.99);
}

.picker__option--selected {
  background: rgba(0, 255, 171, 0.08);
}

.picker__option--selected:hover {
  background: rgba(0, 255, 171, 0.12);
}

/* Symbol badge inside each option */
.picker__option-symbol {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-surface-hover);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.picker__option--selected .picker__option-symbol {
  background: var(--color-primary-dim);
  color: var(--color-primary);
}

.picker__option-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.picker__option-code {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.picker__option-name {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker__option--selected .picker__option-code {
  color: var(--color-primary);
}

/* Checkmark icon */
.picker__option-check {
  color: var(--color-primary);
  flex-shrink: 0;
  animation: scaleIn 0.2s ease;
}

/* --- Empty state --- */
.picker__empty {
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
  text-align: center;
}

.picker__empty strong {
  color: var(--color-text-secondary);
}

/* ==========================================
   SAVE BUTTON
   ========================================== */
.save-btn {
  margin-top: var(--spacing-lg);
  width: 100%;
  padding: 15px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #0A0A0A;
  font-size: 0.875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    opacity var(--transition-fast);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 255, 171, 0.25);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
}

.save-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ==========================================
   DROPDOWN TRANSITION
   ========================================== */
.dropdown-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.99);
}
</style>
