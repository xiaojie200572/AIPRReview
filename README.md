# AI PR Review Assistant

AI 辅助 GitHub PR 代码审查工具 — Chrome 浏览器插件。

## 功能介绍

在 GitHub PR 页面以侧边栏（Side Panel）形式提供 AI 代码审查，无需离开当前页面即可获得分析结果。

### 三种分析模式

- **Walkthrough** — PR 概览：TL;DR、变更模块、变更规模、Review 建议
- **Review** — 深度代码审查：逐文件分析风险，标注 🔴🟡🟢 等级
- **Discuss** — 对话式深入分析：基于前序结果追问

### 模型支持

默认使用智谱 GLM-4-Flash（免费），支持切换任意 OpenAI 兼容模型（DeepSeek、SiliconFlow、Ollama 本地等）。

## 安装使用

```bash
npm install
npm run dev
```

加载 `dist/` 目录到 Chrome 扩展管理页面（启用开发者模式）。

## 项目结构

```
src/
├── background/        # Service Worker：GitHub API、LLM API、diff 处理、缓存
├── content/           # Content Script：自动读取 PR URL
├── sidepanel/         # Side Panel UI：Vue 3 组件 + Prompt 模板
└── icons/             # 扩展图标
```

## 技术栈

- Chrome Extension Manifest V3
- Vue 3 + Vite
- @crxjs/vite-plugin
- marked（Markdown 渲染）

## 许可证

MIT
