import { ref, computed } from 'vue'
import zh from './locales/zh.json'
import en from './locales/en.json'

const locales = { zh, en }
const locale = ref('zh')
const messages = computed(() => locales[locale.value] || locales.zh)

export function t(key) {
  const keys = key.split('.')
  let value = messages.value
  for (const k of keys) {
    value = value?.[k]
  }
  return value ?? key
}

export async function setLocale(lang) {
  locale.value = lang
  await chrome.storage.local.set({ locale: lang })
}

export async function initLocale() {
  const { locale: saved } = await chrome.storage.local.get('locale')
  locale.value = saved || 'zh'
}

export function getLocale() {
  return locale.value
}
