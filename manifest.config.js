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
    'https://open.bigmodel.cn/*',
    'https://github.com/*',
    'https://api.deepseek.com/*',
    'https://api.siliconflow.cn/*',
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
