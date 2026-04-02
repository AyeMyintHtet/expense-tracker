<template>
  <div class="lock-page">
    <!-- Ambient glow -->
    <div class="lock-glow" aria-hidden="true"></div>

    <div class="lock-card">
      <!-- Lock icon -->
      <div class="lock-icon-wrapper" :class="{ 'lock-icon--shake': showError }">
        <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>

      <h2 class="lock-title">Welcome Back</h2>
      <p class="lock-subtitle">Enter your 6-digit PIN to unlock</p>

      <!-- PIN entry -->
      <div class="lock-form">
        <div class="pin-input-wrapper">
          <input
            id="lock-pin"
            ref="pinInput"
            v-model="pin"
            type="password"
            inputmode="numeric"
            maxlength="6"
            class="form-input pin-input"
            :class="{ 'pin-input--error': showError }"
            placeholder="••••••"
            autocomplete="off"
            :disabled="isCooldownActive"
            @input="handleInput"
            @keydown.enter="handleUnlock"
          />
          <!-- Visual digit dots -->
          <div class="pin-dots" aria-hidden="true">
            <span
              v-for="i in 6"
              :key="'ldot-' + i"
              class="pin-dot"
              :class="{
                filled: pin.length >= i && !showError,
                error: pin.length >= i && showError
              }"
            ></span>
          </div>
        </div>

        <p v-if="isCooldownActive" class="lock-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="6" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Too many attempts. Try again in {{ cooldownLabel }}.
        </p>
        <!-- Error message -->
        <p v-else-if="showError" class="lock-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Incorrect PIN. {{ attemptsLeft }} attempt{{ attemptsLeft !== 1 ? 's' : '' }} left.
        </p>

        <button
          class="submit-btn"
          :disabled="pin.length !== 6 || isCooldownActive"
          @click="handleUnlock"
        >
          <span class="btn-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 5-5 5 5 0 0 1 5 5v4"/>
            </svg>
            Unlock
          </span>
        </button>
      </div>

      <!-- Inactivity note -->
      <p class="lock-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        Locked after 30 minutes of inactivity
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import {
  LOCKOUT_DURATION_MS,
  MAX_PIN_ATTEMPTS,
  STORAGE_KEYS,
  clearLockout,
  getFailedAttempts,
  getLockoutUntil,
  resetFailedAttempts,
  sanitizePin,
  setFailedAttempts,
  setLockoutUntil,
  verifyPin,
} from '../utils/security';

const emit = defineEmits(['unlocked']);
const toast = useToast();

const pin = ref('');
const showError = ref(false);
const attemptsLeft = ref(MAX_PIN_ATTEMPTS);
const isCooldownActive = ref(false);
const cooldownRemainingMs = ref(0);
const pinInput = ref(null);
let cooldownTimer = null;

const cooldownLabel = computed(() => {
  const totalSeconds = Math.ceil(cooldownRemainingMs.value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
});

const syncAttemptsLeft = () => {
  const failedAttempts = getFailedAttempts();
  attemptsLeft.value = Math.max(0, MAX_PIN_ATTEMPTS - failedAttempts);
};

const stopCooldownTimer = () => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
    cooldownTimer = null;
  }
};

const updateCooldownState = () => {
  const lockoutUntil = getLockoutUntil();
  const remainingMs = lockoutUntil - Date.now();

  if (remainingMs > 0) {
    isCooldownActive.value = true;
    cooldownRemainingMs.value = remainingMs;
    showError.value = false;
    pin.value = '';
    return;
  }

  isCooldownActive.value = false;
  cooldownRemainingMs.value = 0;
  if (lockoutUntil > 0) {
    clearLockout();
    resetFailedAttempts();
  }
  syncAttemptsLeft();
  stopCooldownTimer();
};

const startCooldownTimer = () => {
  stopCooldownTimer();
  cooldownTimer = setInterval(() => {
    updateCooldownState();
  }, 1000);
};

/** Strip non-digit characters */
const handleInput = () => {
  pin.value = sanitizePin(pin.value);
  // Clear error state when user starts retyping
  if (showError.value) {
    showError.value = false;
  }
};

const handleUnlock = async () => {
  if (pin.value.length !== 6 || isCooldownActive.value) return;

  try {
    const pinMatches = await verifyPin(pin.value);

    if (pinMatches) {
      // PIN matches — unlock the app and reset the activity timestamp
      localStorage.setItem(STORAGE_KEYS.lastActive, Date.now().toString());
      resetFailedAttempts();
      clearLockout();
      syncAttemptsLeft();
      stopCooldownTimer();
      toast.success('Unlocked successfully!');
      emit('unlocked');
    } else {
      // Wrong PIN
      const failedAttempts = getFailedAttempts() + 1;
      setFailedAttempts(failedAttempts);
      syncAttemptsLeft();
      showError.value = true;
      pin.value = '';

      if (failedAttempts >= MAX_PIN_ATTEMPTS) {
        // Lock for a fixed cooldown window after too many failed attempts.
        setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
        updateCooldownState();
        startCooldownTimer();
        toast.error('Too many failed attempts. Locked for 5 minutes.');
      }
    }
  } catch (error) {
    toast.error('Something went wrong. Please try again.');
    console.error('[LockScreen] Failed to verify PIN:', error);
  }
};

// Auto-focus the PIN input on mount
onMounted(() => {
  syncAttemptsLeft();
  updateCooldownState();

  if (isCooldownActive.value) {
    startCooldownTimer();
  }

  pinInput.value?.focus();
});

onBeforeUnmount(() => {
  stopCooldownTimer();
});
</script>

<style scoped>
/* ========== PAGE LAYOUT ========== */
.lock-page {
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

/* Ambient glow */
.lock-glow {
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(0, 255, 171, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: pulseGlow 4s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
}

/* ========== CARD ========== */
.lock-card {
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

/* ========== LOCK ICON ========== */
.lock-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-dim);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.lock-icon-wrapper::after {
  content: '';
  position: absolute;
  width: 76px;
  height: 76px;
  border-radius: calc(var(--radius-lg) + 6px);
  border: 1px solid var(--color-primary-dim);
  animation: pulseGlow 3s ease-in-out infinite;
}

/* Shake animation on wrong PIN */
.lock-icon--shake {
  animation: shake 0.4s ease;
  background: rgba(255, 107, 107, 0.15);
}

.lock-icon--shake::after {
  border-color: rgba(255, 107, 107, 0.2);
}

.lock-icon--shake .lock-icon {
  color: var(--color-expense);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}

.lock-icon {
  width: 32px;
  height: 32px;
  color: var(--color-primary);
  transition: color var(--transition-fast);
}

/* ========== TYPOGRAPHY ========== */
.lock-title {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.lock-subtitle {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.4;
}

/* ========== FORM ========== */
.lock-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

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

.pin-input--error {
  border-color: var(--color-expense) !important;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15) !important;
}

.pin-input::placeholder {
  color: var(--color-text-tertiary);
  letter-spacing: 0.4em;
  font-size: 1.25rem;
}

/* ========== DOTS ========== */
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

/* ========== ERROR MESSAGE ========== */
.lock-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--color-expense);
  animation: fadeInUp 0.2s ease;
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
  transition: all var(--transition-fast);
  margin-top: var(--spacing-sm);
}

.submit-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: var(--color-surface-hover);
  color: var(--color-text-tertiary);
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

/* ========== NOTE ========== */
.lock-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: var(--spacing-xl);
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.lock-note svg {
  flex-shrink: 0;
  opacity: 0.6;
}
</style>
