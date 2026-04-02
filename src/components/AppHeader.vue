<template>
  <header class="app-header">
    <div class="header-brand">
      <!-- Avatar / Logo circle -->
      <div class="brand-avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" fill="#00FFAB"/>
          <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#00FFAB" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="brand-name">Spent</span>
    </div>
  </header>
</template>

<script setup>
// AppHeader — Top bar with logo
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: var(--spacing-lg) 0;
  padding-top: calc(var(--spacing-lg) + 8px);
  animation: fadeIn 0.4s ease;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.brand-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px var(--color-primary-dim);
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
</style>
