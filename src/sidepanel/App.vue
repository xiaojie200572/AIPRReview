<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { send, on, off } from './port.js'
import PRInput from './components/PRInput.vue'
import ModeSelector from './components/ModeSelector.vue'
import ResultPanel from './components/ResultPanel.vue'

const mode = ref('walkthrough')
const content = ref('')
const loading = ref(false)
const errorMsg = ref('')

function onStreamChunk(payload) {
  content.value += payload.chunk
}

function onStreamDone(payload) {
  content.value = payload.fullText
  loading.value = false
}

function onStreamError(payload) {
  errorMsg.value = payload.error
  loading.value = false
}

function analyze(prUrl) {
  content.value = ''
  errorMsg.value = ''
  loading.value = true
  send('ANALYZE_PR', { prUrl, mode: mode.value })
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
    </header>
    <PRInput :loading="loading" @analyze="analyze" />
    <ModeSelector v-model="mode" :disabled="loading" />
    <ResultPanel :content="content" :loading="loading" :error="errorMsg" />
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
  font-weight: 600;
}
</style>
