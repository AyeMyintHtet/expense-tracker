<template>
  <div class="tfa-page">
    <!-- Decorative glow orb behind the card -->
    <div class="tfa-glow" aria-hidden="true"></div>

    <div class="tfa-card">
      <!-- Shield icon -->
      <div class="tfa-icon-wrapper">
        <svg class="tfa-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4" stroke-width="2"/>
        </svg>
      </div>

      <h2 class="tfa-title">Set App Lock PIN</h2>
      <p class="tfa-subtitle">Create a 6-digit PIN to lock this app on this device</p>

      <!-- PIN input -->
      <form class="tfa-form" @submit.prevent="handleConfirm">
        <div class="form-group">
          <label class="form-label text-label" for="tfa-pin">Enter 6-Digit PIN</label>
          <div class="pin-input-wrapper">
            <input
              id="tfa-pin"
              v-model="pin"
              type="password"
              inputmode="numeric"
              maxlength="6"
              class="form-input pin-input"
              placeholder="••••••"
              autocomplete="off"
              @input="handlePinInput"
            />
            <!-- Visual digit indicator dots -->
            <div class="pin-dots" aria-hidden="true">
              <span
                v-for="i in 6"
                :key="'dot-' + i"
                class="pin-dot"
                :class="{ filled: pin.length >= i }"
              ></span>
            </div>
          </div>
          <span v-if="pin.length > 0 && pin.length < 6" class="form-hint form-hint--warning">
            {{ 6 - pin.length }} more digit{{ 6 - pin.length > 1 ? 's' : '' }} needed
          </span>
          <span v-else-if="pin.length === 6" class="form-hint form-hint--success">
            ✓ PIN set
          </span>
        </div>

        <!-- Confirm PIN input -->
        <div class="form-group">
          <label class="form-label text-label" for="tfa-confirm">Confirm PIN</label>
          <div class="pin-input-wrapper">
            <input
              id="tfa-confirm"
              v-model="confirmPin"
              type="password"
              inputmode="numeric"
              maxlength="6"
              class="form-input pin-input"
              placeholder="••••••"
              autocomplete="off"
              @input="handleConfirmInput"
            />
            <div class="pin-dots" aria-hidden="true">
              <span
                v-for="i in 6"
                :key="'cdot-' + i"
                class="pin-dot"
                :class="{
                  filled: confirmPin.length >= i,
                  error: confirmPin.length >= i && confirmPin.length === 6 && !pinsMatch
                }"
              ></span>
            </div>
          </div>
          <!-- Mismatch warning only shown when confirm has 6 digits but doesn't match -->
          <span v-if="confirmPin.length === 6 && !pinsMatch" class="form-hint form-hint--error">
            ✕ PINs do not match
          </span>
          <span v-else-if="pinsMatch && confirmPin.length === 6" class="form-hint form-hint--success">
            ✓ PINs match
          </span>
        </div>

        <!-- Confirm button — disabled unless both PINS are 6 digits AND match -->
        <button
          type="submit"
          class="submit-btn"
          :class="{ 'submit-btn--ready': isValid }"
          :disabled="!isValid"
        >
          <span class="btn-content">
            <svg v-if="!saved" class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <svg v-else class="btn-icon btn-icon--check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ saved ? 'PIN Saved!' : 'Save PIN' }}
          </span>
        </button>
      </form>

      <!-- Info note -->
      <p class="tfa-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        Your PIN hash is stored locally on this device only.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { sanitizePin, savePinHash } from '../utils/security';

const emit = defineEmits(['pinSaved']);
const toast = useToast();

const pin = ref('');
const confirmPin = ref('');
const saved = ref(false);

const handlePinInput = () => {
  pin.value = sanitizePin(pin.value);
};

const handleConfirmInput = () => {
  confirmPin.value = sanitizePin(confirmPin.value);
};

/** Both fields must be exactly 6 digits AND identical */
const pinsMatch = computed(() => {
  return pin.value.length === 6 && confirmPin.value === pin.value;
});

/** Button is only enabled when both PINs are valid and matching */
const isValid = computed(() => pinsMatch.value && !saved.value);

const handleConfirm = async () => {
  if (!isValid.value) return;

  try {
    await savePinHash(pin.value);

    saved.value = true;
    toast.success('PIN saved successfully!');
    emit('pinSaved');

    // Reset saved state after 2 seconds to allow re-setting
    setTimeout(() => {
      saved.value = false;
      pin.value = '';
      confirmPin.value = '';
    }, 2000);
  } catch (error) {
    toast.error('Failed to save PIN. Please try again.');
    console.error('[TwoFactorAuth] PIN hash save failed:', error);
  }
};
</script>

<style scoped>
/* ========== PAGE LAYOUT ========== */
.tfa-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-lg);
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
}

/* Ambient green glow orb behind card */
.tfa-glow {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(0, 255, 171, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: pulseGlow 4s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.15); }
}

/* ========== CARD ========== */
.tfa-card {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  position: relative;
  z-index: 1;
  animation: scaleIn 0.4s ease;
}

/* ========== SHIELD ICON ========== */
.tfa-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-dim);
  border-radius: var(--radius-lg);
  position: relative;
}

/* Subtle ring pulse around icon */
.tfa-icon-wrapper::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: calc(var(--radius-lg) + 6px);
  border: 1px solid var(--color-primary-dim);
  animation: pulseGlow 3s ease-in-out infinite;
}

.tfa-icon {
  width: 32px;
  height: 32px;
  color: var(--color-primary);
}

/* ========== TYPOGRAPHY ========== */
.tfa-title {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.tfa-subtitle {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.4;
}

/* ========== FORM ========== */
.tfa-form {
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

/* Wrapper keeps the real input on top and dots below */
.pin-input-wrapper {
  position: relative;
}

.pin-input {
  width: 100%;
  padding: 16px var(--spacing-md);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 1.5rem;
  letter-spacing: 0.75em;
  text-align: center;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  -webkit-appearance: none;
}

.pin-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
}

.pin-input::placeholder {
  color: var(--color-text-tertiary);
  letter-spacing: 0.4em;
  font-size: 1.25rem;
}

/* ========== DOT INDICATORS ========== */
.pin-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: var(--spacing-sm);
}

.pin-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-surface-hover);
  border: 1.5px solid var(--color-border);
  transition: all var(--transition-fast);
}

.pin-dot.filled {
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 8px rgba(0, 255, 171, 0.4);
  transform: scale(1.15);
}

.pin-dot.error {
  background: var(--color-expense);
  border-color: var(--color-expense);
  box-shadow: 0 0 8px rgba(255, 107, 107, 0.4);
}

/* ========== HINTS ========== */
.form-hint {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.form-hint--warning {
  color: var(--color-tertiary);
}

.form-hint--success {
  color: var(--color-primary);
}

.form-hint--error {
  color: var(--color-expense);
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* ========== SUBMIT BUTTON ========== */
.submit-btn {
  width: 100%;
  padding: 16px;
  background: var(--color-primary);
  color: #0A0A0A;
  font-size: 0.9375rem;
  font-weight: 700;
  border-radius: var(--radius-md);
  transition: all var(--transition-smooth);
  margin-top: var(--spacing-sm);
  position: relative;
  overflow: hidden;
}

.submit-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: var(--color-surface-hover);
  color: var(--color-text-tertiary);
}

.submit-btn--ready {
  animation: glowPulse 1.5s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(0, 255, 171, 0.2); }
  50% { box-shadow: 0 4px 25px rgba(0, 255, 171, 0.45); }
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(0, 255, 171, 0.35);
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.btn-icon {
  flex-shrink: 0;
}

.btn-icon--check {
  animation: scaleIn 0.3s ease;
}

/* ========== INFO NOTE ========== */
.tfa-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: var(--spacing-xl);
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.tfa-note svg {
  flex-shrink: 0;
  opacity: 0.6;
}
</style>
