<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { send, on, off } from './port.js'
import PRInput from './components/PRInput.vue'
import ModeSelector from './components/ModeSelector.vue'
import ResultPanel from './components/ResultPanel.vue'
import SettingsModal from './components/SettingsModal.vue'
import ChatInput from './components/ChatInput.vue'

const mode = ref('walkthrough')
const modeContent = ref({ walkthrough: '', review: '' })
const messages = ref([])
const loading = ref(false)
const errorMsg = ref('')
const showSettings = ref(false)
const savedUrl = ref('')
const modeCompleted = ref({ walkthrough: false, review: false, discuss: false })
const streamActive = ref(false)

const content = computed({
  get: () => modeContent.value[mode.value] || '',
  set: (val) => { modeContent.value[mode.value] = val },
})

let parsedPR = null

function parsePRUrl(url) {
  const m = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/)
  if (m) return { owner: m[1], repo: m[2], prNumber: m[3] }
  return null
}

const buttonState = computed(() => {
  if (mode.value === 'discuss') return 'export'
  if (loading.value) return 'loading'
  if (modeCompleted.value[mode.value]) return 'export'
  return 'analyze'
})

const exportDisabled = computed(() => {
  if (mode.value === 'discuss') return messages.value.length === 0
  return !content.value
})

const exportContent = computed(() => {
  if (mode.value === 'discuss') return formatChatExport()
  return content.value
})

function formatChatExport() {
  const header = parsedPR
    ? `# PR 讨论 - ${parsedPR.owner}/${parsedPR.repo} #${parsedPR.prNumber}\n\n`
    : '# PR 讨论\n\n'
  return header + messages.value.map(m =>
    `## ${m.role === 'user' ? '你' : 'AI'}\n${m.content}`
  ).join('\n\n---\n\n')
}

function getExportFilename() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)
  if (parsedPR) return `${parsedPR.owner}-${parsedPR.repo}-PR#${parsedPR.prNumber}-${mode.value}-${ts}.md`
  return `pr-review-${mode.value}-${ts}.md`
}

function downloadBlob(content, filename) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function onStreamChunk(payload) {
  if (!streamActive.value) return
  if (mode.value === 'discuss') {
    const idx = messages.value.length - 1
    if (idx >= 0 && messages.value[idx].role === 'assistant') {
      messages.value[idx] = {
        ...messages.value[idx],
        content: messages.value[idx].content + payload.chunk,
      }
    }
  } else {
    content.value += payload.chunk
  }
}

function onStreamDone(payload) {
  if (!streamActive.value) return
  streamActive.value = false
  if (mode.value === 'discuss') {
    const idx = messages.value.length - 1
    if (idx >= 0 && messages.value[idx].role === 'assistant') {
      messages.value[idx] = {
        ...messages.value[idx],
        content: payload.fullText,
      }
    }
  } else {
    content.value = payload.fullText
    modeCompleted.value[mode.value] = true
  }
  loading.value = false
}

function onStreamError(payload) {
  if (!streamActive.value) return
  streamActive.value = false
  if (mode.value === 'discuss') {
    messages.value.pop()
  }
  errorMsg.value = payload.error
  loading.value = false
}

function onChatStreamChunk(payload) {
  if (!streamActive.value) return
  const idx = messages.value.length - 1
  if (idx >= 0 && messages.value[idx].role === 'assistant') {
    messages.value[idx] = {
      ...messages.value[idx],
      content: messages.value[idx].content + payload.chunk,
    }
  }
}

function onChatStreamDone(payload) {
  if (!streamActive.value) return
  streamActive.value = false
  const idx = messages.value.length - 1
  if (idx >= 0 && messages.value[idx].role === 'assistant') {
    messages.value[idx] = {
      ...messages.value[idx],
      content: payload.fullText,
    }
  }
  loading.value = false
}

function onChatStreamError(payload) {
  if (!streamActive.value) return
  streamActive.value = false
  messages.value.pop()
  errorMsg.value = payload.error
  loading.value = false
}

function analyze(prUrl) {
  parsedPR = parsePRUrl(prUrl)
  content.value = ''
  messages.value = []
  errorMsg.value = ''
  loading.value = true
  streamActive.value = true
  savedUrl.value = prUrl
  chrome.storage.session.set({ prUrl })
  chrome.storage.session.set({ lastResult: null })
  send('ANALYZE_PR', { prUrl, mode: mode.value })
}

function handleExport() {
  downloadBlob(exportContent.value, getExportFilename())
}

function cancelStream() {
  streamActive.value = false
  send('CANCEL_STREAM')
  if (mode.value === 'discuss') {
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'assistant' && !last.content) {
      messages.value.pop()
    }
  }
  loading.value = false
}

function handleSendMessage(msg) {
  if (!savedUrl.value || loading.value) return
  messages.value.push({ role: 'user', content: msg })
  messages.value.push({ role: 'assistant', content: '' })
  loading.value = true
  streamActive.value = true
  errorMsg.value = ''
  send('SEND_MESSAGE', {
    prUrl: savedUrl.value,
    messages: messages.value.slice(0, -1),
    userMessage: msg,
  })
}

watch(mode, (newMode, oldMode) => {
  if (newMode === 'discuss') {
    errorMsg.value = ''
  }
  if (oldMode === 'discuss' && newMode !== 'discuss') {
    messages.value = []
  }
})

onMounted(async () => {
  on('STREAM_CHUNK', onStreamChunk)
  on('STREAM_DONE', onStreamDone)
  on('STREAM_ERROR', onStreamError)
  on('CHAT_STREAM_CHUNK', onChatStreamChunk)
  on('CHAT_STREAM_DONE', onChatStreamDone)
  on('CHAT_STREAM_ERROR', onChatStreamError)
  const { prUrl } = await chrome.storage.session.get('prUrl')
  if (prUrl) {
    savedUrl.value = prUrl
    parsedPR = parsePRUrl(prUrl)
  }
})

onUnmounted(() => {
  off('STREAM_CHUNK', onStreamChunk)
  off('STREAM_DONE', onStreamDone)
  off('STREAM_ERROR', onStreamError)
  off('CHAT_STREAM_CHUNK', onChatStreamChunk)
  off('CHAT_STREAM_DONE', onChatStreamDone)
  off('CHAT_STREAM_ERROR', onChatStreamError)
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>AI PR Review</h1>
      <button class="btn-icon" @click="showSettings = true" title="设置">⚙</button>
    </header>
    <PRInput
      :button-state="buttonState"
      :url="savedUrl"
      :export-content="exportContent"
      :export-filename="getExportFilename()"
      :export-disabled="exportDisabled"
      @analyze="analyze"
      @export="handleExport"
      @cancel="cancelStream"
    />
    <ModeSelector v-model="mode" :disabled="loading && mode !== 'discuss'" />
    <ResultPanel
      :content="content"
      :loading="loading"
      :error="errorMsg"
      :messages="messages"
    />
    <ChatInput
      v-if="mode === 'discuss'"
      :disabled="loading"
      @send="handleSendMessage"
      @cancel="cancelStream"
    />
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
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
  font-weight: 600;
}
.btn-icon {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
</style>
