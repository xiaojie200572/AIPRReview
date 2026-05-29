<script setup>
// Side Panel 根组件 — 后续串联 PRInput / ModeSelector / ResultPanel / SettingsModal
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>AI PR Review</h1>
    </header>
    <main class="app-body">
      <p>准备就绪</p>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.app-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}
.app-header h1 {
  margin: 0;
  font-size: 16px;
}
.app-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
</style>
