<template>
  <section class="settings-tab" aria-label="Settings">
    <div class="tab-header">
      <p class="text-label">Preferences</p>
      <h2 class="tab-title">Settings</h2>
    </div>

    <!-- ============================
         CURRENCY SETTINGS CARD
         ============================ -->
    <article class="currency-card" @click="showCurrencyModal = true">
      <div class="currency-card__header">
        <div class="currency-card__header-left">
          <div class="currency-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <div>
            <h3 class="currency-card__title">Currency</h3>
            <p class="currency-card__subtitle">Default for all balances &amp; reports</p>
          </div>
        </div>

        <span class="currency-card__current">
          {{ currentCurrencyLabel }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </article>

    <!-- Currency picker modal (reuses CurrencySetupModal) -->
    <CurrencySetupModal v-if="showCurrencyModal" :currency="currency" :options="currencyOptions"
      @save="handleCurrencyModalSave" />

    <!-- ============================
         PASSCODE SETTINGS CARD
         ============================ -->
    <article class="passcode-card">
      <div class="passcode-card__header">
        <div class="currency-card__header-left">
          <div class="passcode-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V8a5 5 0 0 1 10 0v3" />
            </svg>
          </div>
          <div>
            <h3 class="currency-card__title">Passcode</h3>
            <p class="currency-card__subtitle">Change your app lock PIN</p>
          </div>
        </div>

        <button type="button" class="passcode-toggle-btn" :aria-expanded="isPasscodeFormOpen ? 'true' : 'false'"
          @click="togglePasscodeForm">
          {{ isPasscodeFormOpen ? 'Cancel' : 'Update New Passcode' }}
        </button>
      </div>

      <transition name="dropdown">
        <form v-if="isPasscodeFormOpen" class="passcode-form" @submit.prevent="handlePasscodeUpdate">
          <div class="passcode-field">
            <label class="text-label" for="old-pin">Old PIN</label>
            <input id="old-pin" v-model="oldPin" type="password" inputmode="numeric" maxlength="6"
              class="passcode-input" placeholder="••••••" autocomplete="off" @input="handleOldPinInput" />
          </div>

          <div class="passcode-field">
            <label class="text-label" for="new-pin">New PIN</label>
            <input id="new-pin" v-model="newPin" type="password" inputmode="numeric" maxlength="6"
              class="passcode-input" placeholder="••••••" autocomplete="off" @input="handleNewPinInput" />
          </div>

          <div class="passcode-field">
            <label class="text-label" for="retype-new-pin">Retype New PIN</label>
            <input id="retype-new-pin" v-model="retypeNewPin" type="password" inputmode="numeric" maxlength="6"
              class="passcode-input" placeholder="••••••" autocomplete="off" @input="handleRetypePinInput" />
          </div>

          <p v-if="isSameAsOldPin" class="passcode-hint passcode-hint--error">
            New PIN must be different from old PIN.
          </p>
          <p v-else-if="hasPinMismatch" class="passcode-hint passcode-hint--error">
            New PIN and retyped PIN do not match.
          </p>
          <p v-else-if="isPasscodeFormValid" class="passcode-hint passcode-hint--success">
            Ready to update passcode.
          </p>

          <button type="submit" class="passcode-submit-btn" :disabled="!isPasscodeFormValid || isUpdatingPasscode">
            {{ isUpdatingPasscode ? 'Updating Passcode...' : 'Save New Passcode' }}
          </button>
        </form>
      </transition>
    </article>

    <!-- ============================
         LEGAL SECTION
         ============================ -->
    <article class="legal-card">
      <div class="legal-card__header">
        <div class="currency-card__header-left">
          <div class="legal-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="14" y2="17" />
            </svg>
          </div>
          <div>
            <h3 class="currency-card__title">Legal</h3>
            <p class="currency-card__subtitle">Read privacy policy and terms</p>
          </div>
        </div>
      </div>

      <div class="legal-actions">
        <button type="button" class="legal-action-btn" @click="openLegalModal('privacy')">
          Privacy Policy
        </button>
        <button type="button" class="legal-action-btn" @click="openLegalModal('terms')">
          Terms &amp; Condition
        </button>
      </div>
    </article>

    <p class="settings-license">LINCENCE by June</p>
  </section>

  <Teleport to="body">
    <div v-if="activeLegalDocument" class="legal-modal-overlay" @click.self="closeLegalModal">
      <div class="legal-modal" role="dialog" aria-modal="true" aria-label="Legal document popup">
        <div class="legal-modal__header">
          <h3 class="legal-modal__title">{{ activeLegalContent?.title }}</h3>
          <button type="button" class="legal-modal__icon-close" aria-label="Close legal document"
            @click="closeLegalModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p class="legal-modal__updated">Last updated: April 3, 2026</p>

        <div class="legal-modal__body">
          <section v-for="section in activeLegalContent?.sections" :key="section.heading" class="legal-modal__section">
            <h4 class="legal-modal__section-title">{{ section.heading }}</h4>
            <p class="legal-modal__section-text">{{ section.text }}</p>
          </section>
        </div>

        <button type="button" class="legal-modal__close-btn" @click="closeLegalModal">
          Close
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import CurrencySetupModal from './CurrencySetupModal.vue';
import {
  clearLockout,
  resetFailedAttempts,
  sanitizePin,
  savePinHash,
  verifyPin,
} from '../utils/security';

const props = defineProps({
  currency: {
    type: String,
    default: 'USD',
  },
  currencyOptions: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['currencyChange']);
const toast = useToast();

const showCurrencyModal = ref(false);
const isPasscodeFormOpen = ref(false);
const isUpdatingPasscode = ref(false);
const oldPin = ref('');
const newPin = ref('');
const retypeNewPin = ref('');
const activeLegalDocument = ref(null);

const LEGAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: '1. Data We Store',
        text: 'This app stores transaction records, selected currency, app lock PIN hash, and security attempts locally on your device.',
      },
      {
        heading: '2. How Data Is Used',
        text: 'Stored data is used only to provide budgeting features such as balance calculations, reports, and app lock protection.',
      },
      {
        heading: '3. Data Sharing',
        text: 'The app does not automatically send your personal financial data to external servers.',
      },
      {
        heading: '4. Your Control',
        text: 'You can remove app data by clearing your browser/app storage or uninstalling the application.',
      },
      {
        heading: '5. Security Notice',
        text: 'Your PIN is saved as a hash on the current device. Keep your device protected and do not share your PIN.',
      },
    ],
  },
  terms: {
    title: 'Terms & Condition',
    sections: [
      {
        heading: '1. Acceptance',
        text: 'By using this app, you agree to these terms and take responsibility for how you use the financial tracking features.',
      },
      {
        heading: '2. Personal Use',
        text: 'This app is provided for personal budgeting and expense tracking. You are responsible for the accuracy of entered data.',
      },
      {
        heading: '3. No Financial Advice',
        text: 'Information in the app is for tracking and reporting only and does not represent financial, legal, or tax advice.',
      },
      {
        heading: '4. Service Availability',
        text: 'The app is provided as-is without warranty. Features may change or be updated over time.',
      },
      {
        heading: '5. Data Responsibility',
        text: 'You are responsible for keeping backups if needed and securing access to your own device.',
      },
    ],
  },
};

/** Displays the current currency code + name in the card */
const currentCurrencyLabel = computed(() => {
  return props.currency;
});

const hasPinMismatch = computed(() => {
  return retypeNewPin.value.length === 6 && retypeNewPin.value !== newPin.value;
});

const isSameAsOldPin = computed(() => {
  return oldPin.value.length === 6 && newPin.value.length === 6 && oldPin.value === newPin.value;
});

const isPasscodeFormValid = computed(() => {
  return (
    oldPin.value.length === 6 &&
    newPin.value.length === 6 &&
    retypeNewPin.value.length === 6 &&
    !hasPinMismatch.value &&
    !isSameAsOldPin.value
  );
});

const activeLegalContent = computed(() => {
  if (!activeLegalDocument.value) return null;
  return LEGAL_CONTENT[activeLegalDocument.value] || null;
});

/** Called when CurrencySetupModal saves a selection */
const handleCurrencyModalSave = (currencyCode) => {
  showCurrencyModal.value = false;
  emit('currencyChange', currencyCode);
};

const resetPasscodeForm = () => {
  oldPin.value = '';
  newPin.value = '';
  retypeNewPin.value = '';
};

const togglePasscodeForm = () => {
  isPasscodeFormOpen.value = !isPasscodeFormOpen.value;

  if (!isPasscodeFormOpen.value) {
    resetPasscodeForm();
  }
};

const handleOldPinInput = () => {
  oldPin.value = sanitizePin(oldPin.value);
};

const handleNewPinInput = () => {
  newPin.value = sanitizePin(newPin.value);
};

const handleRetypePinInput = () => {
  retypeNewPin.value = sanitizePin(retypeNewPin.value);
};

const handlePasscodeUpdate = async () => {
  if (!isPasscodeFormValid.value || isUpdatingPasscode.value) return;

  try {
    isUpdatingPasscode.value = true;

    const isOldPinValid = await verifyPin(oldPin.value);
    if (!isOldPinValid) {
      toast.error('Old PIN is incorrect.');
      return;
    }

    await savePinHash(newPin.value);
    resetFailedAttempts();
    clearLockout();
    resetPasscodeForm();
    isPasscodeFormOpen.value = false;
    toast.success('Passcode updated successfully.');
  } catch (error) {
    toast.error('Failed to update passcode. Please try again.');
    console.error('[SettingsTab] Failed to update passcode:', error);
  } finally {
    isUpdatingPasscode.value = false;
  }
};

const openLegalModal = (type) => {
  activeLegalDocument.value = type;
};

const closeLegalModal = () => {
  activeLegalDocument.value = null;
};

const handleEscapeKey = (event) => {
  if (event.key !== 'Escape') return;

  if (activeLegalDocument.value) {
    closeLegalModal();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscapeKey);
});
</script>

<style scoped>
/* ==========================================
   SETTINGS TAB — Page-level
   ========================================== */
.settings-tab {
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

/* ==========================================
   CURRENCY CARD — Glassmorphic container
   ========================================== */
.currency-card {
  position: relative;
  overflow: visible;
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  cursor: pointer;

  /* Layered gradient background for depth */
  background:
    linear-gradient(160deg, rgba(0, 255, 171, 0.03) 0%, transparent 40%),
    var(--color-surface);
  border: 1px solid var(--color-border);

  /* Subtle inner glow at the top edge */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 4px 24px rgba(0, 0, 0, 0.2);

  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.currency-card:hover {
  border-color: rgba(0, 255, 171, 0.2);
  background:
    linear-gradient(160deg, rgba(0, 255, 171, 0.05) 0%, transparent 40%),
    var(--color-surface);
}

.currency-card__current {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: fit-content;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  background: var(--color-primary-dim);
  color: var(--color-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.passcode-card {
  margin-top: var(--spacing-md);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  background:
    linear-gradient(160deg, rgba(0, 255, 171, 0.02) 0%, transparent 45%),
    var(--color-surface);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 4px 20px rgba(0, 0, 0, 0.18);
}

.passcode-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.passcode-card__icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: rgba(0, 255, 171, 0.12);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.passcode-toggle-btn {
  flex-shrink: 0;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast),
    background var(--transition-fast);
}

.passcode-toggle-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(0, 255, 171, 0.06);
}

.passcode-form {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.passcode-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.passcode-input {
  width: 100%;
  padding: 14px var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  font-size: 1.05rem;
  letter-spacing: 0.45em;
  text-align: center;
  outline: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.passcode-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
}

.passcode-input::placeholder {
  color: var(--color-text-tertiary);
  letter-spacing: 0.35em;
}

.passcode-hint {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.passcode-hint--error {
  color: var(--color-expense);
}

.passcode-hint--success {
  color: var(--color-primary);
}

.passcode-submit-btn {
  margin-top: 2px;
  width: 100%;
  min-height: 46px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #0A0A0A;
  font-size: 0.875rem;
  font-weight: 700;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    opacity var(--transition-fast);
}

.passcode-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 255, 171, 0.24);
}

.passcode-submit-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.legal-card {
  margin-top: var(--spacing-md);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  background:
    linear-gradient(160deg, rgba(0, 255, 171, 0.02) 0%, transparent 45%),
    var(--color-surface);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 4px 20px rgba(0, 0, 0, 0.18);
}

.legal-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.legal-card__icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: rgba(0, 255, 171, 0.12);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.legal-actions {
  margin-top: var(--spacing-lg);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
}

.legal-action-btn {
  min-height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 700;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    transform var(--transition-fast);
}

.legal-action-btn:hover {
  border-color: var(--color-primary);
  background: rgba(0, 255, 171, 0.08);
  transform: translateY(-1px);
}

.settings-license {
  margin-top: var(--spacing-md);
  margin-bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom));
  text-align: center;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
}

.legal-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.legal-modal {
  width: 100%;
  max-width: 430px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
  animation: scaleIn 0.24s ease;
}

.legal-modal__header {
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.legal-modal__title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.legal-modal__icon-close {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.legal-modal__icon-close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.legal-modal__updated {
  padding: 0 var(--spacing-md);
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.legal-modal__body {
  margin-top: var(--spacing-sm);
  padding: 0 var(--spacing-md) var(--spacing-md);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.legal-modal__section {
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
}

.legal-modal__section-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.legal-modal__section-text {
  margin-top: 6px;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--color-text-secondary);
}

.legal-modal__close-btn {
  margin: 0 var(--spacing-md) var(--spacing-md);
  min-height: 42px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #0A0A0A;
  font-size: 0.875rem;
  font-weight: 700;
  transition: opacity var(--transition-fast);
}

.legal-modal__close-btn:hover {
  opacity: 0.9;
}

/* --- Card header --- */
.currency-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.currency-card__header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.currency-card__icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: var(--color-primary-dim);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.currency-card__title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.currency-card__subtitle {
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  line-height: 1.35;
}

/* dropdown transition — used by passcode form */
.dropdown-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.99);
}

/* ==========================================
   RESPONSIVE
   ========================================== */
@media (max-width: 360px) {
  .preview-row {
    grid-template-columns: 1fr;
  }

  .currency-card__header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .passcode-card__header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .legal-actions {
    grid-template-columns: 1fr;
  }
}
</style>
