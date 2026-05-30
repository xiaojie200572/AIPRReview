<script setup>
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits(['close'])

const PROVIDERS = [
  { label: '智谱 GLM',           baseUrl: 'https://open.bigmodel.cn/api/paas/v4',        models: ['glm-4-flash', 'glm-4-plus', 'glm-4v-plus'] },
  { label: 'DeepSeek',           baseUrl: 'https://api.deepseek.com/v1',                 models: ['deepseek-chat', 'deepseek-reasoner'] },
  { label: 'OpenAI',             baseUrl: 'https://api.openai.com/v1',                   models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { label: 'Claude (Anthropic)', baseUrl: 'https://api.anthropic.com/v1',                models: ['claude-sonnet-4-20250514', 'claude-haiku-3-5'] },
  { label: '通义千问',            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-max', 'qwen-plus', 'qwen-turbo'] },
  { label: 'Kimi (Moonshot)',    baseUrl: 'https://api.moonshot.cn/v1',                  models: ['moonshot-v1-8k', 'moonshot-v1-32k'] },
  { label: 'SiliconFlow',        baseUrl: 'https://api.siliconflow.cn/v1',               models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'] },
  { label: 'Groq',               baseUrl: 'https://api.groq.com/openai/v1',              models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] },
  { label: 'MiniMax',            baseUrl: 'https://api.minimax.chat/v1',                 models: ['minimax-text-01'] },
  { label: '零一万物 Yi',         baseUrl: 'https://api.lingyiwanwu.com/v1',              models: ['yi-lightning', 'yi-large'] },
  { label: 'Together AI',        baseUrl: 'https://api.together.xyz/v1',                 models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo'] },
  { label: 'xAI',                baseUrl: 'https://api.x.ai/v1',                         models: ['grok-beta'] },
  { label: 'Mistral AI',         baseUrl: 'https://api.mistral.ai/v1',                   models: ['mistral-large-latest'] },
  { label: 'OpenRouter',         baseUrl: 'https://openrouter.ai/api/v1',                models: ['openrouter/auto'] },
]

const apiKey = ref('')
const baseUrl = ref('')
const modelName = ref('')
const githubToken = ref('')
const saving = ref(false)
const saved = ref(false)
const showBaseUrlDropdown = ref(false)
const showModelDropdown = ref(false)

const queryBaseUrl = computed(() => baseUrl.value.trim().toLowerCase())

const filteredBaseUrls = computed(() => {
  if (!queryBaseUrl.value) return PROVIDERS
  return PROVIDERS.filter(p =>
    p.label.toLowerCase().includes(queryBaseUrl.value) ||
    p.baseUrl.toLowerCase().includes(queryBaseUrl.value)
  )
})

const matchedProvider = computed(() =>
  PROVIDERS.find(p => p.baseUrl === baseUrl.value.trim())
)

const filteredModels = computed(() => {
  const query = modelName.value.trim().toLowerCase()
  const pool = matchedProvider.value
    ? matchedProvider.value.models
    : [...new Set(PROVIDERS.flatMap(p => p.models))]
  if (!query) return pool
  return pool.filter(m => m.toLowerCase().includes(query))
})

async function loadSettings() {
  const settings = await chrome.storage.local.get(['apiKey', 'baseUrl', 'modelName', 'githubToken'])
  apiKey.value = settings.apiKey || ''
  baseUrl.value = settings.baseUrl || 'https://open.bigmodel.cn/api/paas/v4'
  modelName.value = settings.modelName || 'glm-4-flash'
  githubToken.value = settings.githubToken || ''
}

async function save() {
  saving.value = true
  saved.value = false
  await chrome.storage.local.set({
    apiKey: apiKey.value,
    baseUrl: baseUrl.value,
    modelName: modelName.value,
    githubToken: githubToken.value,
  })
  saving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

function selectBaseUrl(p) {
  baseUrl.value = p.baseUrl
  showBaseUrlDropdown.value = false
  const prov = PROVIDERS.find(x => x.baseUrl === p.baseUrl)
  if (prov && !prov.models.includes(modelName.value)) {
    modelName.value = prov.models[0]
  }
}

function selectModel(m) {
  modelName.value = m
  showModelDropdown.value = false
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
          <div class="autocomplete">
            <input
              v-model="baseUrl"
              placeholder="https://open.bigmodel.cn/api/paas/v4"
              @focus="showBaseUrlDropdown = true"
              @input="showBaseUrlDropdown = true"
              @blur="setTimeout(() => showBaseUrlDropdown = false, 150)"
            />
            <ul v-if="showBaseUrlDropdown && filteredBaseUrls.length" class="dropdown">
              <li
                v-for="p in filteredBaseUrls"
                :key="p.baseUrl"
                :class="{ active: baseUrl === p.baseUrl }"
                @mousedown.prevent="selectBaseUrl(p)"
              >
                <span class="item-label">{{ p.label }}</span>
                <span class="item-url">{{ p.baseUrl }}</span>
              </li>
            </ul>
          </div>
        </label>

        <label>
          <span>模型名称</span>
          <div class="autocomplete">
            <input
              v-model="modelName"
              placeholder="glm-4-flash"
              @focus="showModelDropdown = true"
              @input="showModelDropdown = true"
              @blur="setTimeout(() => showModelDropdown = false, 150)"
            />
            <ul v-if="showModelDropdown && filteredModels.length" class="dropdown">
              <li
                v-for="m in filteredModels"
                :key="m"
                :class="{ active: modelName === m }"
                @mousedown.prevent="selectModel(m)"
              >
                <span class="item-label">{{ m }}</span>
              </li>
            </ul>
          </div>
        </label>

        <label>
          <span>GitHub Token（可选，私有仓库使用）</span>
          <input v-model="githubToken" type="password" placeholder="选填" />
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
  max-width: 400px;
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
  width: 100%;
}
.modal-body input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-focus);
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

.autocomplete {
  position: relative;
}
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 200;
  margin: 2px 0 0;
  padding: 4px 0;
  list-style: none;
  background: var(--bg-modal);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  max-height: 200px;
  overflow-y: auto;
}
.dropdown li {
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 12px;
}
.dropdown li:hover,
.dropdown li.active {
  background: var(--bg-secondary);
}
.item-label {
  color: var(--text-primary);
  font-weight: 500;
}
.item-url {
  color: var(--text-tertiary);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
