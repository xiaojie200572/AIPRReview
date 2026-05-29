<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { send, on, off } from './port.js'
import PRInput from './components/PRInput.vue'
import ModeSelector from './components/ModeSelector.vue'
import ResultPanel from './components/ResultPanel.vue'
import SettingsModal from './components/SettingsModal.vue'

const mode = ref('walkthrough')
const content = ref('')
const loading = ref(false)
const errorMsg = ref('')
const showSettings = ref(false)
const savedUrl = ref('')

function onStreamChunk(payload) {
  content.value += payload.chunk
}

function onStreamDone(payload) {
  content.value = payload.fullText
  loading.value = false
  chrome.storage.session.set({ lastResult: payload.fullText })
}

function onStreamError(payload) {
  errorMsg.value = payload.error
  loading.value = false
}

async function analyze(prUrl) {
  content.value = ''
  errorMsg.value = ''
  loading.value = true
  savedUrl.value = prUrl
  await chrome.storage.session.set({ prUrl })
  send('ANALYZE_PR', { prUrl, mode: mode.value })
}

onMounted(async () => {
  on('STREAM_CHUNK', onStreamChunk)
  on('STREAM_DONE', onStreamDone)
  on('STREAM_ERROR', onStreamError)
  const { prUrl } = await chrome.storage.session.get('prUrl')
  if (prUrl) savedUrl.value = prUrl
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
      <button class="btn-icon" @click="showSettings = true" title="设置">⚙</button>
    </header>
    <PRInput :loading="loading" :url="savedUrl" @analyze="analyze" />
    <ModeSelector v-model="mode" :disabled="loading" />
    <ResultPanel :content="content" :loading="loading" :error="errorMsg" />
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-secondary);
}
.app-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.btn-icon {
  background: none;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: var(--text-primary);
}
</style>
