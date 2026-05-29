<script setup>
import { ref, watch, onMounted } from 'vue'

const emit = defineEmits(['close'])

const apiKey = ref('')
const baseUrl = ref('')
const modelName = ref('')
const githubToken = ref('')
const darkMode = ref(false)
const saving = ref(false)
const saved = ref(false)

watch(darkMode, (val) => {
  document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light')
})

async function loadSettings() {
  const settings = await chrome.storage.local.get(['apiKey', 'baseUrl', 'modelName', 'githubToken', 'darkMode'])
  apiKey.value = settings.apiKey || ''
  baseUrl.value = settings.baseUrl || 'https://open.bigmodel.cn/api/paas/v4'
  modelName.value = settings.modelName || 'glm-4-flash'
  githubToken.value = settings.githubToken || ''
  darkMode.value = settings.darkMode || false
}

async function save() {
  saving.value = true
  saved.value = false
  await chrome.storage.local.set({
    apiKey: apiKey.value,
    baseUrl: baseUrl.value,
    modelName: modelName.value,
    githubToken: githubToken.value,
    darkMode: darkMode.value,
  })
  saving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

onMounted(loadSettings)
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>设置</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <label>
          <span>API Key</span>
          <input v-model="apiKey" type="password" placeholder="必填" />
        </label>
        <label>
          <span>Base URL</span>
          <input v-model="baseUrl" placeholder="https://open.bigmodel.cn/api/paas/v4" />
        </label>
        <label>
          <span>模型名称</span>
          <input v-model="modelName" placeholder="glm-4-flash" />
        </label>
        <label>
          <span>GitHub Token（可选，私有仓库使用）</span>
          <input v-model="githubToken" type="password" placeholder="选填" />
        </label>
        <label class="toggle-row">
          <span>黑夜模式</span>
          <label class="toggle">
            <input v-model="darkMode" type="checkbox" />
            <span class="slider"></span>
          </label>
        </label>
        <p class="hint">支持任意 OpenAI 兼容格式的模型，切换模型只需修改 Base URL 和模型名称。</p>
      </div>
      <div class="modal-footer">
        <span v-if="saved" class="saved-msg">已保存</span>
        <button :disabled="saving" @click="save">{{ saving ? '保存中...' : '保存配置' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--bg-modal);
  border-radius: 12px;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-secondary);
}
.modal-header h2 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}
.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
}
.modal-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal-body label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-body label span {
  font-size: 12px;
  color: var(--text-secondary);
}
.modal-body input {
  padding: 8px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  color: var(--text-primary);
  background: var(--bg-primary);
}
.modal-body input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-focus);
}
.toggle-row {
  flex-direction: row !important;
  align-items: center;
  justify-content: space-between;
}
.hint {
  font-size: 11px;
  color: var(--text-tertiary);
  margin: 4px 0 0;
  line-height: 1.4;
}
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid var(--border-secondary);
}
.modal-footer button {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}
.modal-footer button:disabled {
  opacity: 0.5;
}
.saved-msg {
  color: var(--text-success);
  font-size: 13px;
}
</style>
