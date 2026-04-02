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

    <button class="header-notification" aria-label="Notifications">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <!-- Notification dot -->
      <span class="notification-dot"></span>
    </button>
  </header>
</template>

<script setup>
// AppHeader — Top bar with logo and notification bell
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.header-notification {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.header-notification:hover {
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary);
}
</style>
