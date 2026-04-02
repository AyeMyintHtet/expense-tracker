<template>
  <button class="fab" @click="$emit('click')" aria-label="Add transaction">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>
</template>

<script setup>
// Floating action button – opens the add transaction modal
defineEmits(['click']);
</script>

<style scoped>
.fab {
  position: fixed;
  bottom: calc(var(--nav-height) + 16px);
  right: calc(50% - 215px + 24px); /* Positioned inside the 430px frame */
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #0A0A0A;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 20px rgba(0, 255, 171, 0.35),
    0 0 40px rgba(0, 255, 171, 0.15);
  z-index: 110;
  transition: all var(--transition-smooth);
  animation: scaleIn 0.4s var(--transition-spring) both;
  animation-delay: 0.6s;
}

.fab:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow:
    0 6px 28px rgba(0, 255, 171, 0.45),
    0 0 60px rgba(0, 255, 171, 0.2);
}

.fab:active {
  transform: scale(0.95) rotate(90deg);
}

/* On smaller screens, position relative to right edge */
@media (max-width: 480px) {
  .fab {
    right: 24px;
  }
}
</style>
