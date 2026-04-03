<template>
  <Teleport to="body">
    <transition name="install-banner">
      <div v-if="show" class="install-banner" role="dialog" aria-live="polite" aria-label="Install app banner">
        <div class="install-banner__content">
          <p class="install-banner__title">Install App</p>
          <p class="install-banner__subtitle">Get fast access from your home screen with offline support.</p>
        </div>

        <div class="install-banner__actions">
          <button type="button" class="install-banner__btn install-banner__btn--close" @click="$emit('dismiss')">
            Close
          </button>
          <button type="button" class="install-banner__btn install-banner__btn--install" @click="$emit('install')">
            Install
          </button>
        </div>
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

defineEmits(['install', 'dismiss']);
</script>

<style scoped>
.install-banner {
  position: fixed;
  left: 50%;
  bottom: calc(var(--nav-height) + 22px);
  transform: translateX(-50%);
  width: calc(100% - 24px);
  max-width: 406px;
  z-index: 340;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 255, 171, 0.18);
  background:
    linear-gradient(130deg, rgba(0, 255, 171, 0.12) 0%, rgba(0, 255, 171, 0.02) 40%),
    rgba(20, 20, 20, 0.96);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: var(--spacing-md);
}

.install-banner__content {
  margin-bottom: var(--spacing-sm);
}

.install-banner__title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.install-banner__subtitle {
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.install-banner__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.install-banner__btn {
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  min-height: 34px;
  padding: 0 12px;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.install-banner__btn--close {
  color: var(--color-text-secondary);
  border-color: var(--color-border);
  background: transparent;
}

.install-banner__btn--close:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.install-banner__btn--install {
  color: #0A0A0A;
  background: var(--color-primary);
}

.install-banner__btn--install:hover {
  box-shadow: 0 6px 16px rgba(0, 255, 171, 0.35);
}

.install-banner-enter-active,
.install-banner-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.install-banner-enter-from,
.install-banner-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
