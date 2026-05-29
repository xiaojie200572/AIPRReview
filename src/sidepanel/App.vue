<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { send, on, off } from './port.js'

const prUrl = ref('')
const output = ref('')
const loading = ref(false)
const error = ref('')

function onStreamChunk(payload) {
  output.value += payload.chunk
}

function onStreamDone(payload) {
  output.value = payload.fullText
  loading.value = false
}

function onStreamError(payload) {
  error.value = payload.error
  loading.value = false
}

function analyze() {
  if (!prUrl.value.trim()) return
  output.value = ''
  error.value = ''
  loading.value = true
  send('ANALYZE_PR', { prUrl: prUrl.value.trim(), mode: 'walkthrough' })
}

function getSettings() {
  send('GET_SETTINGS', {})
}

onMounted(() => {
  on('STREAM_CHUNK', onStreamChunk)
  on('STREAM_DONE', onStreamDone)
  on('STREAM_ERROR', onStreamError)
})

onUnmounted(() => {
  off('STREAM_CHUNK', onStreamChunk)
  off('STREAM_DONE', onStreamDone)
  off('STREAM_ERROR', onStreamError)
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>AI PR Review</h1>
      <button class="btn-icon" @click="getSettings" title="设置">⚙</button>
    </header>
    <main class="app-body">
      <div class="input-row">
        <input v-model="prUrl" placeholder="https://github.com/owner/repo/pull/123" @keyup.enter="analyze" />
        <button :disabled="loading || !prUrl.trim()" @click="analyze">{{ loading ? '分析中...' : '分析' }}</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="output" class="result">{{ output }}</div>
      <div v-if="loading && !output" class="loading">等待分析结果...</div>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}
.app-header h1 {
  margin: 0;
  font-size: 16px;
}
.btn-icon {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}
.app-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.input-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}
.input-row button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}
.input-row button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.error {
  color: #dc2626;
  background: #fef2f2;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  white-space: pre-wrap;
}
.result {
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
}
.loading {
  color: #6b7280;
  text-align: center;
  margin-top: 24px;
}
</style>
