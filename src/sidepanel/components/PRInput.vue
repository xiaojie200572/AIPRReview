<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  loading: Boolean,
  url: { type: String, default: '' },
})

const emit = defineEmits(['analyze'])

const url = ref(props.url)

watch(() => props.url, (val) => {
  if (val) url.value = val
})

function submit() {
  if (!url.value.trim() || props.loading) return
  emit('analyze', url.value.trim())
}
</script>

<template>
  <div class="pr-input">
    <div class="input-row">
      <input
        v-model="url"
        placeholder="https://github.com/owner/repo/pull/123"
        :disabled="loading"
        @keyup.enter="submit"
      />
      <button :disabled="loading || !url.trim()" @click="submit">
        {{ loading ? '分析中...' : '分析' }}
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
.input-row button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}
.input-row button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
