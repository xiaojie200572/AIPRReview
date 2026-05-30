<script setup>
import { computed } from 'vue'
import { t } from '../../shared/i18n/index.js'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/core'
import DOMPurify from 'dompurify'

import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import diff from 'highlight.js/lib/languages/diff'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('python', python)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('diff', diff)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
}))

const inlineRenderer = {
  codespan({ text }) {
    if (text.includes('/') || text.includes('\\')) {
      return `<code class="hl-path">${text}</code>`
    }
    if (text.startsWith('@')) {
      return `<code class="hl-module">${text}</code>`
    }
    return `<code>${text}</code>`
  },
}

marked.use({ renderer: inlineRenderer })

const props = defineProps({
  content: { type: String, default: '' },
  loading: Boolean,
  error: { type: String, default: '' },
  messages: { type: Array, default: () => [] },
})

const rendered = computed(() => {
  if (!props.content) return ''
  return DOMPurify.sanitize(marked(props.content, { breaks: true, gfm: true }))
})

function renderMd(text) {
  return DOMPurify.sanitize(marked(text, { breaks: true, gfm: true }))
}
</script>

<template>
  <div class="result-panel">
    <div v-if="error" class="error-box">{{ error }}</div>

    <div v-if="loading && !content && !messages.length" class="loading">
      <div class="spinner"></div>
      <span>{{ t('resultPanel.loading') }}</span>
    </div>

    <div v-if="messages.length" class="chat-area">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="['msg', msg.role === 'user' ? 'msg-user' : 'msg-assistant']"
      >
        <div class="msg-label">{{ msg.role === 'user' ? t('chatInput.you') : 'AI' }}</div>
        <div class="msg-body" v-html="renderMd(msg.content)"></div>
      </div>
      <div v-if="loading" class="loading-inline">
        <div class="spinner small"></div>
        <span>{{ t('resultPanel.loading') }}</span>
      </div>
    </div>

    <div v-else-if="content && !messages.length" class="markdown-body" v-html="rendered"></div>
  </div>
</template>

<style scoped>
.result-panel {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: var(--bg-primary);
}
.error-box {
  color: var(--text-danger);
  background: var(--bg-danger);
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  font-size: 13px;
}
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 40px;
  color: var(--text-secondary);
  font-size: 13px;
}
.loading-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: var(--text-secondary);
  font-size: 12px;
}
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--spinner-track);
  border-top-color: var(--spinner-active);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner.small {
  width: 14px;
  height: 14px;
  border-width: 2px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.chat-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.msg {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.msg-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
}
.msg-user .msg-label {
  color: var(--accent);
}
.msg-assistant .msg-label {
  color: #059669;
}
.msg-body {
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-secondary);
}
.msg-user .msg-body {
  background: var(--bg-blockquote);
  border: 1px solid var(--border-primary);
}
.msg-assistant .msg-body {
  background: var(--bg-code);
  border: 1px solid var(--border-secondary);
}
.msg-body :deep(pre) {
  background: var(--bg-code);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  margin: 8px 0;
}
.msg-body :deep(code) {
  background: var(--bg-code);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
}
.msg-body :deep(pre code) {
  background: none;
  padding: 0;
}
.msg-body :deep(h1) { font-size: 16px; margin: 12px 0 6px; }
.msg-body :deep(h2) { font-size: 14px; margin: 10px 0 4px; }
.msg-body :deep(h3) { font-size: 13px; margin: 8px 0 4px; }
.msg-body :deep(hr) { margin: 12px 0; border: none; border-top: 1px solid var(--border-secondary); }
.msg-body :deep(blockquote) {
  margin: 6px 0;
  padding: 4px 10px;
  border-left: 3px solid var(--accent);
  background: var(--bg-secondary);
  border-radius: 0 4px 4px 0;
}
.msg-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 6px 0;
  font-size: 12px;
}
.msg-body :deep(th), :deep(td) {
  border: 1px solid var(--border-secondary);
  padding: 4px 6px;
  text-align: left;
}
.msg-body :deep(th) {
  background: var(--bg-secondary);
  font-weight: 600;
}
.msg-body :deep(ul), :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}
.msg-body :deep(li) {
  margin: 2px 0;
}
.markdown-body {
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}
.markdown-body :deep(pre) {
  background: var(--bg-code);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
}
.markdown-body :deep(code) {
  background: var(--bg-code);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
}
.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}
.markdown-body :deep(h1) { font-size: 18px; margin: 16px 0 8px; }
.markdown-body :deep(h2) { font-size: 16px; margin: 14px 0 6px; }
.markdown-body :deep(h3) { font-size: 14px; margin: 12px 0 4px; }
.markdown-body :deep(hr) { margin: 16px 0; border: none; border-top: 1px solid var(--border-secondary); }
.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid var(--accent);
  background: var(--bg-blockquote);
  border-radius: 0 4px 4px 0;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 12px;
}
.markdown-body :deep(th), :deep(td) {
  border: 1px solid var(--border-secondary);
  padding: 6px 8px;
  text-align: left;
}
.markdown-body :deep(th) {
  background: var(--bg-secondary);
  font-weight: 600;
}
.markdown-body :deep(ul), :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}
.markdown-body :deep(li) {
  margin: 2px 0;
}

/* Syntax highlighting */
.msg-body :deep(code.hl-path),
.markdown-body :deep(code.hl-path) {
  color: var(--syntax-path);
  font-weight: 500;
}
.msg-body :deep(code.hl-module),
.markdown-body :deep(code.hl-module) {
  color: var(--syntax-module);
  font-weight: 500;
}
.msg-body :deep(pre code.hljs),
.markdown-body :deep(pre code.hljs) {
  display: block;
  overflow-x: auto;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--bg-code);
  border-radius: 6px;
}
.msg-body :deep(.hljs-keyword),
.markdown-body :deep(.hljs-keyword) { color: var(--syntax-keyword); }
.msg-body :deep(.hljs-string),
.markdown-body :deep(.hljs-string) { color: var(--syntax-string); }
.msg-body :deep(.hljs-title),
.markdown-body :deep(.hljs-title) { color: var(--syntax-function); }
.msg-body :deep(.hljs-title.function_),
.markdown-body :deep(.hljs-title.function_) { color: var(--syntax-function); }
.msg-body :deep(.hljs-number),
.markdown-body :deep(.hljs-number) { color: var(--syntax-constant); }
.msg-body :deep(.hljs-built_in),
.markdown-body :deep(.hljs-built_in) { color: var(--syntax-constant); }
.msg-body :deep(.hljs-literal),
.markdown-body :deep(.hljs-literal) { color: var(--syntax-constant); }
.msg-body :deep(.hljs-comment),
.markdown-body :deep(.hljs-comment) { color: var(--text-tertiary); font-style: italic; }
.msg-body :deep(.hljs-attr),
.markdown-body :deep(.hljs-attr) { color: var(--syntax-function); }
.msg-body :deep(.hljs-attribute),
.markdown-body :deep(.hljs-attribute) { color: var(--syntax-function); }
.msg-body :deep(.hljs-selector-class),
.markdown-body :deep(.hljs-selector-class) { color: var(--syntax-module); }
.msg-body :deep(.hljs-selector-tag),
.markdown-body :deep(.hljs-selector-tag) { color: var(--syntax-keyword); }
.msg-body :deep(.hljs-meta),
.markdown-body :deep(.hljs-meta) { color: var(--syntax-constant); }
</style>
