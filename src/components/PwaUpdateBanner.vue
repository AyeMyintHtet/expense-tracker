<template>
  <Teleport to="body">
    <transition name="update-banner">
      <div v-if="show" class="update-banner" role="status" aria-live="polite">
        <div class="banner-content">
          <p class="banner-title">New version available</p>
          <p class="banner-subtitle">Update now to use the latest features and fixes.</p>
        </div>

        <div class="banner-actions">
          <button class="banner-btn banner-btn--ghost" @click="$emit('dismiss')">
            Later
          </button>
          <button class="banner-btn banner-btn--primary" @click="$emit('update')">
            Update now
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

defineEmits(['update', 'dismiss']);
</script>

<style scoped>
.update-banner {
  position: fixed;
  left: 50%;
  bottom: calc(var(--nav-height) + 22px);
  transform: translateX(-50%);
  width: calc(100% - 24px);
  max-width: 406px;
  background: rgba(20, 20, 20, 0.98);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
  z-index: 350;
  padding: var(--spacing-md);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.banner-content {
  margin-bottom: var(--spacing-sm);
}

.banner-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.banner-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.banner-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.banner-btn {
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.banner-btn--ghost {
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.banner-btn--ghost:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.banner-btn--primary {
  color: #0A0A0A;
  background: var(--color-primary);
}

.banner-btn--primary:hover {
  box-shadow: 0 4px 14px rgba(0, 255, 171, 0.35);
}

.update-banner-enter-active,
.update-banner-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.update-banner-enter-from,
.update-banner-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
