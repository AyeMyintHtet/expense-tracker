<template>
  <section class="greeting" aria-label="User greeting">
    <p class="greeting-label text-label">WELCOME BACK</p>
    <h1 class="greeting-name text-heading">Hello, Jane</h1>
  </section>
</template>

<script setup>
// GreetingSection — "Welcome back / Hello, Jane"
</script>

<style scoped>
.greeting {
  padding: var(--spacing-sm) 0 var(--spacing-lg);
  animation: fadeInUp 0.5s ease both;
  animation-delay: 0.1s;
}

.greeting-label {
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-tertiary);
}

.greeting-name {
  font-size: 1.75rem;
}
</style>
