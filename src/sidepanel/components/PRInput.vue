<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  buttonState: { type: String, default: 'analyze' },
  url: { type: String, default: '' },
  exportContent: { type: String, default: '' },
  exportFilename: { type: String, default: '' },
  exportDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['analyze', 'export', 'cancel'])

const url = ref(props.url)

watch(() => props.url, (val) => {
  if (val) url.value = val
})

const label = computed(() => {
  switch (props.buttonState) {
    case 'loading': return '× 取消'
    case 'export': return '导出'
    default: return '分析'
  }
})

const disabled = computed(() => {
  if (props.buttonState === 'loading') return false
  if (props.buttonState === 'analyze') return !url.value.trim()
  if (props.buttonState === 'export') return props.exportDisabled
  return false
})

const btnClass = computed(() => {
  if (props.buttonState === 'loading') return ['btn', 'btn-cancel']
  if (props.buttonState === 'export') return ['btn', 'btn-export']
  return ['btn']
})

function handleClick() {
  if (props.buttonState === 'analyze') {
    if (!url.value.trim()) return
    emit('analyze', url.value.trim())
  } else if (props.buttonState === 'loading') {
    emit('cancel')
  } else if (props.buttonState === 'export') {
    if (props.exportDisabled) return
    emit('export')
  }
}
</script>

<template>
  <div class="pr-input">
    <div class="input-row">
      <input
        v-model="url"
        placeholder="https://github.com/owner/repo/pull/123"
        :disabled="buttonState === 'loading'"
        @keyup.enter="buttonState === 'analyze' && url.trim() && emit('analyze', url.trim())"
      />
      <button
        :class="btnClass"
        :disabled="disabled"
        @click="handleClick"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pr-input {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-secondary);
}
.input-row {
  display: flex;
  gap: 8px;
}
.input-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  color: var(--text-primary);
  background: var(--bg-primary);
}
.input-row input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-focus);
}
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-export {
  background: var(--syntax-path);
}
.btn-export:hover:not(:disabled) {
  filter: brightness(0.9);
}
.btn-cancel {
  background: var(--text-danger);
}
.btn-cancel:hover:not(:disabled) {
  filter: brightness(0.9);
}
</style>
