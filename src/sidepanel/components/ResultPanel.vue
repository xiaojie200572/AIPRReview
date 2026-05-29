<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  content: { type: String, default: '' },
  loading: Boolean,
  error: { type: String, default: '' },
})

const rendered = computed(() => {
  if (!props.content) return ''
  return marked(props.content, { breaks: true, gfm: true })
})
</script>

<template>
  <div class="result-panel">
    <div v-if="error" class="error-box">{{ error }}</div>

    <div v-if="loading && !content" class="loading">
      <div class="spinner"></div>
      <span>等待分析结果...</span>
    </div>

    <div v-if="content" class="markdown-body" v-html="rendered"></div>
  </div>
</template>

<style scoped>
.result-panel {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
.error-box {
  color: #dc2626;
  background: #fef2f2;
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
  color: #6b7280;
  font-size: 13px;
}
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.markdown-body {
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}
.markdown-body :deep(pre) {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
}
.markdown-body :deep(code) {
  background: #f3f4f6;
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
.markdown-body :deep(hr) { margin: 16px 0; border: none; border-top: 1px solid #e5e7eb; }
.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid #2563eb;
  background: #f9fafb;
  border-radius: 0 4px 4px 0;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 12px;
}
.markdown-body :deep(th), :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  text-align: left;
}
.markdown-body :deep(th) {
  background: #f9fafb;
  font-weight: 600;
}
.markdown-body :deep(ul), :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}
.markdown-body :deep(li) {
  margin: 2px 0;
}
</style>
