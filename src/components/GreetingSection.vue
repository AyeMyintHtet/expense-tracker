<template>
  <section class="greeting" aria-label="User greeting">
    <p class="greeting-label text-label">WELCOME BACK</p>
  </section>
</template>

<script setup>
// GreetingSection — "Welcome back"
</script>

<style scoped>
.greeting {
  padding: var(--spacing-sm) 0 var(--spacing-lg);
  animation: fadeInUp 0.5s ease both;
  animation-delay: 0.1s;
}

.greeting-label {
  color: var(--color-text-tertiary);
}
</style>
