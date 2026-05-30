import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { initLocale } from '../shared/i18n/index.js'

Promise.all([
  chrome.storage.local.get('darkMode'),
  initLocale(),
]).then(([{ darkMode }]) => {
  if (darkMode) document.documentElement.setAttribute('data-theme', 'dark')
})

createApp(App).mount('#app')
