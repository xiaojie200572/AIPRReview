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
  <div class="mode-selector">
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
.mode-selector {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}
.tab {
  flex: 1;
  padding: 10px 8px;
  border: none;
  background: none;
  font-size: 13px;
  cursor: pointer;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.tab:hover {
  color: #374151;
}
.tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 600;
}
.tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
