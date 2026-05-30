import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'AI PR Review Assistant',
  version: pkg.version,
  description: 'AI 辅助 GitHub PR 代码审查工具',
  icons: {
    16: 'src/icons/icon16.png',
    48: 'src/icons/icon48.png',
    128: 'src/icons/icon128.png',
  },
  action: {
    default_title: 'AI PR Review',
  },
  background: {
    service_worker: 'src/background/index.js',
    type: 'module',
  },
  content_scripts: [{
    js: ['src/content/index.js'],
    matches: ['https://github.com/*/pull/*'],
  }],
  permissions: [
    'sidePanel',
    'storage',
    'activeTab',
  ],

  host_permissions: [
    'https://api.github.com/*',
    'https://github.com/*',

    // LLM API providers (OpenAI-compatible + Claude)
    'https://api.openai.com/*',
    'https://api.anthropic.com/*',
    'https://open.bigmodel.cn/*',
    'https://api.deepseek.com/*',
    'https://api.siliconflow.cn/*',
    'https://dashscope.aliyuncs.com/*',
    'https://api.moonshot.cn/*',
    'https://api.minimax.chat/*',
    'https://api.lingyiwanwu.com/*',
    'https://api.groq.com/*',
    'https://api.together.xyz/*',
    'https://api.perplexity.ai/*',
    'https://api.mistral.ai/*',
    'https://api.x.ai/*',
    'https://api.cohere.com/*',
    'https://api.fireworks.ai/*',
    'https://generativelanguage.googleapis.com/*',
    'https://openrouter.ai/*',
    'https://api.cerebras.ai/*',
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
