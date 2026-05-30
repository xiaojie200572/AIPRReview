<script setup>
import { ref } from 'vue'
import { t } from '../../shared/i18n/index.js'

const props = defineProps({
  disabled: Boolean,
})

const emit = defineEmits(['send', 'cancel'])

const text = ref('')

function submit() {
  const msg = text.value.trim()
  if (!msg || props.disabled) return
  emit('send', msg)
  text.value = ''
}
</script>

<template>
  <div class="chat-input">
    <input
      v-model="text"
      :placeholder="t('chatInput.placeholder')"
      :disabled="disabled"
      @keyup.enter="submit"
    />
    <button
      v-if="!disabled"
      :disabled="!text.trim()"
      @click="submit"
    >
      {{ t('chatInput.send') }}    </button>
    <button
      v-else
      class="btn-cancel"
      @click="$emit('cancel')"
    >
      × {{ t('prInput.cancel') }}
    </button>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-secondary);
  background: var(--bg-primary);
}
.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  color: var(--text-primary);
  background: var(--bg-primary);
}
.chat-input input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-focus);
}
.chat-input button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}
.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-cancel {
  background: var(--text-danger);
}
.btn-cancel:hover:not(:disabled) {
  filter: brightness(0.9);
}
</style>
