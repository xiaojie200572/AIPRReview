<script setup>
import { ref } from 'vue'

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
      placeholder="输入您的问题..."
      :disabled="disabled"
      @keyup.enter="submit"
    />
    <button
      v-if="!disabled"
      :disabled="!text.trim()"
      @click="submit"
    >
      发送
    </button>
    <button
      v-else
      class="btn-cancel"
      @click="$emit('cancel')"
    >
      × 停止
    </button>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}
.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}
.chat-input input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
.chat-input button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
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
  background: #dc2626;
}
.btn-cancel:hover:not(:disabled) {
  background: #b91c1c;
}
</style>
