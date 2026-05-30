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
const darkMode = ref(false)
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
  if (payload._restored) {
    if (mode.value !== 'discuss') {
      modeContent.value[mode.value] = payload.fullText
      modeCompleted.value[mode.value] = true
    }
    loading.value = false
    return
  }
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

function onPRUrl(payload) {
  savedUrl.value = payload.url
  parsedPR = parsePRUrl(payload.url)
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
  try {
    send('ANALYZE_PR', { prUrl, mode: mode.value })
  } catch (err) {
    streamActive.value = false
    errorMsg.value = err.message || String(err)
    loading.value = false
  }
}

function handleExport() {
  downloadBlob(exportContent.value, getExportFilename())
}

function cancelStream() {
  streamActive.value = false
  try {
    send('CANCEL_STREAM')
  } catch {}
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
  try {
    send('SEND_MESSAGE', {
      prUrl: savedUrl.value,
      messages: messages.value.slice(0, -1),
      userMessage: msg,
    })
  } catch (err) {
    streamActive.value = false
    messages.value.pop()
    messages.value.pop()
    errorMsg.value = err.message || String(err)
    loading.value = false
  }
}

async function toggleTheme() {
  darkMode.value = !darkMode.value
  document.documentElement.setAttribute('data-theme', darkMode.value ? 'dark' : 'light')
  await chrome.storage.local.set({ darkMode: darkMode.value })
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
  on('PR_URL', onPRUrl)
  const { prUrl } = await chrome.storage.session.get('prUrl')
  if (prUrl) {
    savedUrl.value = prUrl
    parsedPR = parsePRUrl(prUrl)
    send('RESTORE_RESULT', { url: prUrl, mode: mode.value })
  }
  const { darkMode: dm } = await chrome.storage.local.get('darkMode')
  darkMode.value = dm || false
})

onUnmounted(() => {
  off('STREAM_CHUNK', onStreamChunk)
  off('STREAM_DONE', onStreamDone)
  off('STREAM_ERROR', onStreamError)
  off('CHAT_STREAM_CHUNK', onChatStreamChunk)
  off('CHAT_STREAM_DONE', onChatStreamDone)
  off('CHAT_STREAM_ERROR', onChatStreamError)
  off('PR_URL', onPRUrl)
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>AI PR Review</h1>
      <div class="header-actions">
        <button class="btn-icon" @click="toggleTheme" :title="darkMode ? '切换浅色模式' : '切换黑夜模式'">{{ darkMode ? '☀' : '☾' }}</button>
        <button class="btn-icon" @click="showSettings = true" title="设置">⚙</button>
      </div>
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
    <div class="card">
      <ModeSelector v-model="mode" :disabled="loading && mode !== 'discuss'" />
      <ResultPanel
        :content="content"
        :loading="loading"
        :error="errorMsg"
        :messages="messages"
      />
    </div>
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
.header-actions {
  display: flex;
  gap: 6px;
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
.card {
  margin: 8px 12px 12px;
  border-radius: 10px;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
