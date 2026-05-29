import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

chrome.storage.local.get('darkMode').then(({ darkMode }) => {
  if (darkMode) document.documentElement.setAttribute('data-theme', 'dark')
})

createApp(App).mount('#app')
