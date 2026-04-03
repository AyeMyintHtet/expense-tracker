<template>
  <Teleport to="body">
    <transition name="ios-install-tooltip">
      <div v-if="show" class="ios-install-tooltip" role="status" aria-live="polite">
        <div class="ios-install-tooltip__content">
          <p class="ios-install-tooltip__title">Install on iPhone</p>

          <p class="ios-install-tooltip__step">
            <span class="ios-install-tooltip__index">1</span>
            Tap
            <span class="ios-install-tooltip__share">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 16V3" />
                <path d="M8 7l4-4 4 4" />
                <rect x="4" y="13" width="16" height="8" rx="2" />
              </svg>
              Share
            </span>
            in Safari.
          </p>

          <p class="ios-install-tooltip__step">
            <span class="ios-install-tooltip__index">2</span>
            Scroll down and tap <strong>Add to Home Screen</strong>.
          </p>
        </div>

        <button type="button" class="ios-install-tooltip__dismiss" @click="$emit('dismiss')">
          Got it
        </button>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['dismiss']);
</script>

<style scoped>
.ios-install-tooltip {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 10px);
  transform: translateX(-50%);
  width: calc(100% - 24px);
  max-width: 406px;
  z-index: 420;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(34, 34, 34, 0.76);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
  padding: 12px 12px 14px;
}

.ios-install-tooltip::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -9px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(34, 34, 34, 0.76);
}

.ios-install-tooltip__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ios-install-tooltip__title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.ios-install-tooltip__step {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--color-text-secondary);
}

.ios-install-tooltip__index {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(0, 255, 171, 0.35);
  background: rgba(0, 255, 171, 0.1);
  color: var(--color-primary);
  font-size: 0.6875rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ios-install-tooltip__share {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
  font-weight: 600;
}

.ios-install-tooltip__dismiss {
  margin-top: 10px;
  width: 100%;
  min-height: 34px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
  font-size: 0.75rem;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.ios-install-tooltip__dismiss:hover {
  border-color: var(--color-primary);
  background: rgba(0, 255, 171, 0.1);
}

.ios-install-tooltip-enter-active,
.ios-install-tooltip-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.ios-install-tooltip-enter-from,
.ios-install-tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
