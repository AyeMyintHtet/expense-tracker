<template>
  <nav class="bottom-nav" aria-label="Main navigation">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="nav-item"
      :class="{ active: activeTab === tab.id, 'nav-item--add': tab.id === 'add' }"
      @click="$emit('tabChange', tab.id)"
      :aria-label="tab.label"
      :aria-current="activeTab === tab.id ? 'page' : undefined"
    >
      <!-- HOME icon -->
      <svg v-if="tab.id === 'home'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>

      <!-- STATS icon -->
      <svg v-else-if="tab.id === 'stats'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>

      <!-- ADD -->
      <svg v-else-if="tab.id === 'add'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>

      <!-- REPORTS icon -->
      <svg v-else-if="tab.id === 'reports'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>

      <span class="nav-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    default: 'home',
  },
});

defineEmits(['tabChange']);

const tabs = [
  { id: 'home', label: 'HOME' },
  { id: 'stats', label: 'STATS' },
  { id: 'add', label: 'ADD' },
  { id: 'reports', label: 'REPORTS' },
];
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: calc(var(--nav-height) + env(safe-area-inset-bottom));
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 var(--spacing-sm) env(safe-area-inset-bottom);
  z-index: 100;
  /* Frosted glass */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(20, 20, 20, 0.92);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 64px;
  min-height: 52px;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);
  position: relative;
  touch-action: manipulation;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-item--add {
  color: var(--color-text-secondary);
}

/* Active indicator dot */
.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary);
}

.nav-item:hover:not(.active) {
  color: var(--color-text-secondary);
}

.nav-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.nav-label {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.06em;
}
</style>
