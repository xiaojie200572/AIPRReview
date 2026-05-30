<script setup>
defineProps({
  modelValue: { type: String, default: 'walkthrough' },
  disabled: Boolean,
})

const emit = defineEmits(['update:modelValue'])

const modes = [
  { value: 'walkthrough', label: 'Walkthrough' },
  { value: 'review', label: 'Review' },
  { value: 'discuss', label: 'Discuss' },
]

function select(mode) {
  emit('update:modelValue', mode)
}
</script>

<template>
  <div class="card-tabs">
    <button
      v-for="m in modes"
      :key="m.value"
      :class="['tab', { active: modelValue === m.value }]"
      :disabled="disabled"
      @click="select(m.value)"
    >
      {{ m.label }}
    </button>
  </div>
</template>

<style scoped>
.card-tabs {
  display: flex;
  background: var(--tab-bar-bg);
  border-bottom: 1px solid var(--border-secondary);
  flex-shrink: 0;
}
.tab {
  flex: 1;
  padding: 10px 8px;
  border: none;
  background: none;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.15s;
  position: relative;
}
.tab:hover {
  background: var(--tab-hover-bg);
  color: var(--text-primary);
}
.tab.active {
  background: var(--tab-active-bg);
  color: var(--text-primary);
  font-weight: 600;
}
.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  border-radius: 1px;
  background: var(--accent);
}
.tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
